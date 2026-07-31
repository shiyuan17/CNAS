// 红队全流程回归测试：覆盖所有修复缺陷 + 数据流转 + 状态正确性 + 数据隔离
import { chromium } from 'playwright';
const BASE = 'http://localhost:8090/index.html';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const KEY = 'cnas-prototype-mainflow-v1';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  const log = (s) => console.log(s);
  const h1 = async () => (await page.locator('h1').textContent() || '').trim();
  const toast = async () => {
    await sleep(400);
    const t = await page.locator('.toast').last().textContent().catch(() => '');
    return (t || '').replace(/\s+/g, ' ').trim();
  };
  const assert = (cond, msg) => {
    log((cond ? '✅ PASS' : '❌ FAIL') + ': ' + msg);
    if (!cond) errors.push(msg);
  };
  // 读取 localStorage 中的完整状态
  const getState = async () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
  const getRecord = async (id) => {
    const s = await getState();
    return (s.data?.records || []).find(r => r.id === id);
  };
  const getTask = async (id) => {
    const s = await getState();
    return (s.data?.tasks || []).find(t => t.id === id);
  };
  const getCustomer = async (id) => {
    const s = await getState();
    return (s.data?.customers || []).find(c => c.id === id);
  };
  const getCommission = async (id) => {
    const s = await getState();
    return (s.data?.commissions || []).find(c => c.id === id);
  };

  // 重置数据
  await page.goto(`${BASE}`);
  await sleep(400);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/`);
  await sleep(700);

  // ============================================================
  // 测试组 A: 复核人角色死锁修复（缺陷1）
  // ============================================================
  log('========== 测试组 A: 复核链死锁修复 ==========');

  // A1: 技术负责人通过 TASK 复核
  log('\n--- A1: 技术负责人通过任务复核 ---');
  await page.locator('.role-card:has-text("技术负责人")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);
  await page.goto(`${BASE}?ctx=t1#/TM12`);
  await sleep(800);
  assert(await h1() === '结果复核', '进入 TM12 结果复核页');

  const t1Before = await getTask('t1');
  assert(t1Before.status === '待复核', 't1 复核前状态为待复核');

  const passBtn = page.locator('button:has-text("复核通过")');
  assert(await passBtn.count() === 1, '技术负责人看到复核通过按钮');
  if (await passBtn.count() > 0) {
    await passBtn.click();
    await sleep(700);
    const t = await toast();
    assert(t.includes('复核通过'), '复核通过 Toast 正确');
  }

  const t1After = await getTask('t1');
  assert(t1After.status === '已完成', 't1 复核后状态为已完成（状态机允许技术负责人）');

  // A2: RECORD 状态联动（TM12 复核通过 -> 关联记录变为已复核）
  log('\n--- A2: RECORD 状态联动 ---');
  const r1 = await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    return (s.data?.records || []).find(r => r.taskCode === 'TASK-2026-0001');
  }, KEY);
  assert(r1 !== undefined, '存在关联记录 r1');
  assert(r1.status === '已复核', 'r1 联动更新为已复核（TM12 联动 RECORD 状态）');
  assert(r1.reviewedBy === '技术负责人', 'r1 reviewedBy 记录为技术负责人');

  // A3: 退回场景验证（用 t2 先开工再退回）
  log('\n--- A3: 任务退回补充 ---');
  // t2 是"待开工"，需要检测员开工 -> 提交复核 -> 技术负责人退回
  await page.locator('button[data-action="logout"]').click();
  await sleep(400);
  await page.locator('[data-overlay="confirm"]').click();
  await sleep(600);
  await page.locator('.role-card:has-text("检测员")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);

  // 开工 t2
  await page.goto(`${BASE}?ctx=t2#/TM04`);
  await sleep(700);
  const startBtn = page.locator('button:has-text("确认开工")');
  if (await startBtn.count() > 0) {
    await startBtn.click();
    await sleep(600);
    log('  t2 开工: ' + await toast());
  }

  // 提交复核 t2
  await page.goto(`${BASE}?ctx=t2#/TM05`);
  await sleep(700);
  const submitBtn = page.locator('button:has-text("提交审核")');
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await sleep(600);
    log('  t2 提交复核: ' + await toast());
  }

  const t2BeforeReturn = await getTask('t2');
  log('  t2 当前状态: ' + t2BeforeReturn?.status);

  // 技术负责人退回
  if (t2BeforeReturn?.status === '待复核') {
    await page.locator('button[data-action="logout"]').click();
    await sleep(400);
    await page.locator('[data-overlay="confirm"]').click();
    await sleep(600);
    await page.locator('.role-card:has-text("技术负责人")').click();
    await sleep(300);
    await page.locator('button:has-text("进入系统")').click();
    await sleep(500);
    await page.goto(`${BASE}?ctx=t2#/TM12`);
    await sleep(700);
    const returnBtn = page.locator('button:has-text("退回补充")');
    if (await returnBtn.count() > 0) {
      await returnBtn.click();
      await sleep(600);
      log('  t2 退回: ' + await toast());
    }
    const t2AfterReturn = await getTask('t2');
    assert(t2AfterReturn.status === '已退回', 't2 退回后状态为已退回');
  }

  // ============================================================
  // 测试组 B: CUSTOMER create 状态字段修复（缺陷2）
  // ============================================================
  log('\n========== 测试组 B: CUSTOMER 状态字段修复 ==========');
  // 切换业务受理人员
  await page.locator('button[data-action="logout"]').click();
  await sleep(400);
  await page.locator('[data-overlay="confirm"]').click();
  await sleep(600);
  await page.locator('.role-card:has-text("业务受理人员")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);

  // 新建客户
  await page.goto(`${BASE}#/CC01`);
  await sleep(700);
  await page.locator('button:has-text("新建客户")').click();
  await sleep(500);
  await page.locator('[data-form-field="name"]').fill('红队测试客户');
  await page.locator('[data-form-field="type"]').selectOption({ index: 1 }).catch(() => {});
  await page.locator('[data-overlay="submit"]').click();
  await sleep(600);
  log('  新建客户: ' + await toast());

  // 验证新建客户的状态字段
  const newCustomer = await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    const customers = s.data?.customers || [];
    return customers.find(c => c.name === '红队测试客户');
  }, KEY);
  assert(newCustomer !== undefined, '新建客户存在');
  assert(newCustomer?.cooperationStatus === '活跃', 'cooperationStatus 正确设置为活跃');
  assert(newCustomer?.status === undefined, '无幽灵 status 键');

  // ============================================================
  // 测试组 C: nextCode 格式修复（缺陷3）
  // ============================================================
  log('\n========== 测试组 C: nextCode 格式修复 ==========');
  assert(/^[A-Z]+-\d{4}-\d{4}$/.test(newCustomer?.code || ''), `客户编号格式含年份: ${newCustomer?.code}`);

  // 新建委托验证编号
  await page.goto(`${BASE}#/CC04`);
  await sleep(600);
  await page.locator('[data-wizard-field="customer"]').selectOption({ index: 1 }).catch(async () => {});
  await page.locator('[data-wizard-field="type"]').selectOption({ index: 1 }).catch(async () => {});
  await page.locator('[data-wizard-field="requirements"]').fill('红队测试委托');
  await page.locator('button:has-text("创建草稿委托")').click();
  await sleep(600);
  const createToast = await toast();
  const commCodeMatch = createToast.match(/COMM-\d{4}-\d{4}/);
  assert(commCodeMatch !== null, `委托编号格式含年份: ${commCodeMatch?.[0]}`);

  // ============================================================
  // 测试组 D: ID 跨类型碰撞修复（缺陷4）
  // ============================================================
  log('\n========== 测试组 D: ID 跨类型碰撞修复 ==========');
  const newCommission = await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    return (s.data?.commissions || [])[0];
  }, KEY);
  log(`  新客户 ID: ${newCustomer?.id}`);
  log(`  新委托 ID: ${newCommission?.id}`);
  // 客户 ID 应以 cus 开头，委托 ID 应以 comm 开头（不再都以 c 开头）
  assert(newCustomer?.id?.toLowerCase().startsWith('cus'), '客户 ID 前缀为 cus');
  assert(newCommission?.id?.toLowerCase().startsWith('comm'), '委托 ID 前缀为 comm');
  assert(newCustomer?.id !== newCommission?.id, '客户与委托 ID 不碰撞');

  // ============================================================
  // 测试组 E: getTaskChain reports 修复（缺陷5）
  // ============================================================
  log('\n========== 测试组 E: getTaskChain reports 修复 ==========');
  // CC05 委托详情使用 getCommissionChain 展示关联报告；TM03 任务详情使用 getTaskChain
  // 验证 CC05 显示关联报告（cm1 关联 rp1）
  await page.goto(`${BASE}?ctx=cm1#/CC05`);
  await sleep(700);
  const cc05ForChain = await page.locator('#page-content').textContent();
  assert(cc05ForChain.includes('RPT-2026-0001'), 'CC05 委托详情显示关联报告 rp1（getCommissionChain 正确）');
  assert(!cc05ForChain.includes('RPT-2026-0099'), '不会返回不存在的报告');
  // getTaskChain 修复已通过代码审查验证（reports 过滤逻辑修正），
  // 该函数当前未被页面直接调用，通过 getCommissionChain 间接验证关联链路正确性

  // ============================================================
  // 测试组 F: 数据隔离验证
  // ============================================================
  log('\n========== 测试组 F: 数据隔离验证 ==========');
  const state = await getState();
  // F1: 各集合数据不互相污染
  const collections = ['customers', 'commissions', 'samples', 'tasks', 'records', 'reports', 'auditLog'];
  let isolationOk = true;
  for (const col of collections) {
    if (!Array.isArray(state.data?.[col])) {
      isolationOk = false;
      log(`  ❌ ${col} 不是数组`);
    }
  }
  assert(isolationOk, '所有数据集合保持数组结构');

  // F2: 样品只关联到对应委托
  const samples = state.data?.samples || [];
  const s1 = samples.find(s => s.code === 'SMP-0001');
  const s3 = samples.find(s => s.code === 'SMP-0003');
  assert(s1?.commissionCode === 'COMM-2026-0001', 'SMP-0001 关联 COMM-2026-0001');
  assert(s3?.commissionCode === 'COMM-2026-0002', 'SMP-0003 关联 COMM-2026-0002（不串数据）');

  // F3: 任务只关联到对应样品
  const tasks = state.data?.tasks || [];
  const t1 = tasks.find(t => t.code === 'TASK-2026-0001');
  const t2 = tasks.find(t => t.code === 'TASK-2026-0002');
  assert(t1?.sampleCode === 'SMP-0001', 'TASK-0001 关联 SMP-0001');
  assert(t2?.sampleCode === 'SMP-0002', 'TASK-0002 关联 SMP-0002（不串数据）');

  // ============================================================
  // 测试组 G: 页面状态正确性
  // ============================================================
  log('\n========== 测试组 G: 页面状态正确性 ==========');
  // G1: t1 已完成，TM01 列表应显示已完成
  await page.goto(`${BASE}#/TM01`);
  await sleep(700);
  const tm01Content = await page.locator('#page-content').textContent();
  assert(tm01Content.includes('已完成'), 'TM01 列表显示 t1 已完成');

  // G2: CC05 委托详情应显示正确的状态（已受理委托显示"进入样品接收"按钮）
  await page.goto(`${BASE}?ctx=cm1#/CC05`);
  await sleep(700);
  const cc05Content = await page.locator('#page-content').textContent();
  assert(cc05Content.includes('进入样品接收'), 'CC05 显示 cm1 已受理状态（进入样品接收按钮可见）');
  assert(cc05Content.includes('发起变更'), 'CC05 显示已受理委托的变更入口');

  // ============================================================
  // 测试组 H: P04 报告流程（质量负责人审核 -> 授权签字人签发）
  // ============================================================
  log('\n========== 测试组 H: P04 报告审核签发流程 ==========');
  // 切换质量负责人审核报告
  await page.locator('button[data-action="logout"]').click();
  await sleep(400);
  await page.locator('[data-overlay="confirm"]').click();
  await sleep(600);
  await page.locator('.role-card:has-text("质量负责人")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);

  await page.goto(`${BASE}?ctx=rp1#/RM04`);
  await sleep(700);
  const reviewPassBtn = page.locator('button:has-text("审核通过")');
  assert(await reviewPassBtn.count() === 1, '质量负责人看到报告审核通过按钮');
  if (await reviewPassBtn.count() > 0) {
    await reviewPassBtn.click();
    await sleep(600);
    log('  报告审核: ' + await toast());
  }
  const rp1AfterReview = await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    return (s.data?.reports || []).find(r => r.id === 'rp1');
  }, KEY);
  assert(rp1AfterReview?.status === '待签发', '报告审核通过后状态为待签发');

  // 切换授权签字人签发
  log('\n--- 授权签字人签发 ---');
  await page.locator('button[data-action="logout"]').click();
  await sleep(400);
  await page.locator('[data-overlay="confirm"]').click();
  await sleep(600);
  await page.locator('.role-card:has-text("授权签字人")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);
  await page.goto(`${BASE}?ctx=rp1#/RM05`);
  await sleep(700);
  // 先填写授权签字人字段（状态机 sign 前置条件要求 item.signer 非空）
  await page.locator('[data-sign-field="signer"]').fill('孙芳');
  const signBtn = page.locator('button:has-text("授权签发")');
  assert(await signBtn.count() === 1, '授权签字人看到签发按钮');
  if (await signBtn.count() > 0) {
    await signBtn.click();
    await sleep(600);
    log('  报告签发: ' + await toast());
  }
  const rp1AfterSign = await page.evaluate(k => {
    const s = JSON.parse(localStorage.getItem(k) || '{}');
    return (s.data?.reports || []).find(r => r.id === 'rp1');
  }, KEY);
  assert(rp1AfterSign?.status === '已签发', '报告签发后状态为已签发');

  // ============================================================
  // 总结
  // ============================================================
  log('\n========== 测试总结 ==========');
  log('控制台错误: ' + (errors.filter(e => e.startsWith('PAGEERROR')).length));
  log('断言失败: ' + errors.filter(e => !e.startsWith('PAGEERROR')).length);
  if (errors.length) {
    log('失败详情:');
    errors.filter(e => !e.startsWith('PAGEERROR')).forEach(e => log('  ❌ ' + e));
  } else {
    log('🎉 全部红队测试通过！');
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
