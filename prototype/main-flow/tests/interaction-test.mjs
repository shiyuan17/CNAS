// Playwright 交互测试脚本 - 验证 CNAS 原型完整主流程
// 用法: npx playwright test --config=playwright.config.js 或 node --input-type=module 运行

import { chromium } from 'playwright';

const BASE = 'http://localhost:8090/index.html';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 收集 console 错误
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));

  const results = [];
  function log(test, pass, detail = '') {
    const icon = pass ? '✅' : '❌';
    results.push({ test, pass, detail });
    console.log(`${icon} ${test}${detail ? ' — ' + detail : ''}`);
  }

  try {
    // ===== 1. 登录流程 =====
    console.log('\n=== 1. 登录流程 ===');
    await page.goto(`${BASE}?autologin=1#/WB02`);
    await sleep(1500);
    await page.waitForSelector('.app-shell');
    log('自动登录 + 工作台加载', true, 'app-shell 已渲染');

    // ===== 2. CC01 客户台账 =====
    console.log('\n=== 2. CC01 客户台账 ===');
    await page.goto(`${BASE}?autologin=1#/CC01`);
    await sleep(1000);
    const cc01Rows = await page.locator('.data-table tbody tr').count();
    log('CC01 客户列表', cc01Rows === 3, `显示 ${cc01Rows} 条客户记录`);

    // 点击第一个"查看"按钮进入 CC02
    await page.locator('.data-table tbody tr').first().locator('button:has-text("查看")').click();
    await sleep(1000);
    const cc02Title = await page.locator('h1').textContent();
    log('CC01->CC02 导航', cc02Title.includes('客户档案'), `页面标题: ${cc02Title}`);
    const cc02Name = await page.locator('.kv-value').first().textContent();
    log('CC02 客户信息', !!cc02Name, `第一个字段值: ${cc02Name}`);

    // ===== 3. CC03 委托列表 =====
    console.log('\n=== 3. CC03 委托列表 ===');
    await page.goto(`${BASE}?autologin=1#/CC03`);
    await sleep(1000);
    const cc03Rows = await page.locator('.data-table tbody tr').count();
    log('CC03 委托列表', cc03Rows === 3, `显示 ${cc03Rows} 条委托记录`);

    // 点击第一个"详情"按钮进入 CC05
    await page.locator('.data-table tbody tr').first().locator('button:has-text("详情")').click();
    await sleep(1000);
    const cc05Title = await page.locator('h1').textContent();
    log('CC03->CC05 导航', cc05Title.includes('委托详情'), `页面标题: ${cc05Title}`);
    // 验证关联链路
    const cc05ChainText = await page.locator('.link-chain').textContent();
    log('CC05 关联链路', cc05ChainText.includes('样品') && cc05ChainText.includes('任务') && cc05ChainText.includes('报告'), `链路: ${cc05ChainText.replace(/\s+/g, ' ')}`);

    // ===== 4. CC04 新建委托向导 =====
    console.log('\n=== 4. CC04 新建委托向导 ===');
    await page.goto(`${BASE}?autologin=1#/CC04`);
    await sleep(1000);
    const stepCount = await page.locator('.step').count();
    log('CC04 步骤条', stepCount === 5, `${stepCount} 个步骤`);
    // 填写表单
    await page.locator('[data-wizard-field="customer"]').selectOption({ index: 1 });
    await page.locator('[data-wizard-field="type"]').selectOption('检测');
    await page.locator('[data-wizard-field="expectedDate"]').fill('2026-09-01');
    await page.locator('[data-wizard-field="requirements"]').fill('Playwright测试委托');
    await page.locator('[data-wizard-field="sampleCount"]').fill('2份');
    // 点击创建
    await page.locator('button:has-text("创建草稿委托")').click();
    await sleep(1500);
    const afterCreateTitle = await page.locator('h1').textContent();
    log('CC04 创建委托并跳转', afterCreateTitle.includes('委托详情'), `跳转到: ${afterCreateTitle}`);

    // ===== 5. SM04 样品台账 =====
    console.log('\n=== 5. SM04 样品台账 ===');
    await page.goto(`${BASE}?autologin=1#/SM04`);
    await sleep(1000);
    const sm04Rows = await page.locator('.data-table tbody tr').count();
    log('SM04 样品台账', sm04Rows === 3, `显示 ${sm04Rows} 条样品记录`);

    // 点击"追踪"进入 SM05
    await page.locator('.data-table tbody tr').first().locator('button:has-text("追踪")').click();
    await sleep(1000);
    const sm05Title = await page.locator('h1').textContent();
    log('SM04->SM05 导航', sm05Title.includes('样品追踪详情'), `页面标题: ${sm05Title}`);

    // ===== 6. SM02 接收工作台 =====
    console.log('\n=== 6. SM02 接收工作台 ===');
    await page.goto(`${BASE}?autologin=1&ctx=s3#/SM02`);
    await sleep(1000);
    const sm02Title = await page.locator('h1').textContent();
    log('SM02 接收工作台', sm02Title.includes('样品接收工作台'), `页面标题: ${sm02Title}`);
    // 验证权限阻断（业务受理人员无权接收）
    const sm02PermText = await page.locator('.alert.warning').textContent();
    log('SM02 权限阻断', sm02PermText.includes('无权接收'), `提示: ${sm02PermText.substring(0, 50)}`);

    // ===== 7. TM01 任务列表 =====
    console.log('\n=== 7. TM01 任务列表 ===');
    await page.goto(`${BASE}?autologin=1#/TM01`);
    await sleep(1000);
    const tm01Rows = await page.locator('.data-table tbody tr').count();
    log('TM01 任务列表', tm01Rows === 2, `显示 ${tm01Rows} 条任务记录`);

    // 点击第一个"详情"进入 TM03
    await page.locator('.data-table tbody tr').first().locator('button:has-text("详情")').click();
    await sleep(1000);
    const tm03Title = await page.locator('h1').textContent();
    log('TM01->TM03 导航', tm03Title.includes('任务详情'), `页面标题: ${tm03Title}`);
    // 验证原始记录表格
    const tm03RecordRows = await page.locator('.data-table tbody tr').count();
    log('TM03 关联原始记录', tm03RecordRows > 0, `${tm03RecordRows} 条记录`);

    // ===== 8. RM01 报告队列 =====
    console.log('\n=== 8. RM01 报告队列 ===');
    await page.goto(`${BASE}?autologin=1#/RM01`);
    await sleep(1000);
    const rm01Rows = await page.locator('.data-table tbody tr').count();
    log('RM01 报告队列', rm01Rows === 1, `显示 ${rm01Rows} 条报告记录`);

    // 点击"详情"进入 RM08
    await page.locator('.data-table tbody tr').first().locator('button:has-text("详情")').click();
    await sleep(1000);
    const rm08Title = await page.locator('h1').textContent();
    log('RM01->RM08 导航', rm08Title.includes('报告详情'), `页面标题: ${rm08Title}`);

    // ===== 9. WB02 工作台指标 =====
    console.log('\n=== 9. WB02 工作台 ===');
    await page.goto(`${BASE}?autologin=1#/WB02`);
    await sleep(1000);
    const metricCount = await page.locator('.metric').count();
    log('WB02 指标卡', metricCount === 8, `${metricCount} 个指标卡`);
    const flowNodes = await page.locator('.link-node').count();
    log('WB02 流程导航节点', flowNodes > 10, `${flowNodes} 个流程节点`);

    // ===== 10. WB03 待办 =====
    console.log('\n=== 10. WB03 待办 ===');
    await page.goto(`${BASE}?autologin=1#/WB03`);
    await sleep(1000);
    const todoCount = await page.locator('.todo-item').count();
    log('WB03 待办列表', todoCount > 0, `${todoCount} 项待办`);

    // ===== 11. AUDIT 审计 =====
    console.log('\n=== 11. AUDIT 审计 ===');
    await page.goto(`${BASE}?autologin=1#/AUDIT`);
    await sleep(1000);
    const auditItems = await page.locator('.timeline-item').count();
    log('AUDIT 审计轨迹', auditItems > 0, `${auditItems} 条审计记录`);

    // ===== 12. Toast 验证 - 测试"新建客户"表单 =====
    console.log('\n=== 12. 表单交互（新建客户）===');
    await page.goto(`${BASE}?autologin=1#/CC01`);
    await sleep(1000);
    await page.locator('button:has-text("新建客户")').click();
    await sleep(500);
    // 检查 modal 是否出现
    const modalVisible = await page.locator('.modal-backdrop').isVisible();
    log('新建客户表单弹窗', modalVisible, 'Modal 已打开');
    // 填写表单
    await page.locator('[data-form-field="name"]').fill('Playwright测试客户');
    await page.locator('[data-form-field="type"]').selectOption('企业');
    await page.locator('[data-form-field="contact"]').fill('测试联系人');
    await page.locator('[data-form-field="phone"]').fill('139-0000-0000');
    await page.locator('[data-overlay="submit"]').click();
    await sleep(1000);
    // 验证 toast
    const toastVisible = await page.locator('.toast').count();
    log('新建客户 Toast', toastVisible > 0, `Toast 出现: ${toastVisible} 个`);
    // 验证客户已添加
    await page.goto(`${BASE}?autologin=1#/CC01`);
    await sleep(1000);
    const newCount = await page.locator('.data-table tbody tr').count();
    log('客户已创建', newCount === 4, `客户总数: ${newCount}`);

  } catch (e) {
    log('测试异常', false, e.message);
  }

  // ===== 控制台错误检查 =====
  console.log('\n=== 控制台错误 ===');
  log('控制台无错误', errors.length === 0, errors.length > 0 ? errors.slice(0, 3).join(' | ') : '无错误');

  // ===== 汇总 =====
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${results.length} 项`);
  console.log(`${'='.repeat(50)}`);

  await browser.close();
  return failed === 0;
}

test().then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error(e); process.exit(1); });
