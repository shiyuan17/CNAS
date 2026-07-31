// CC06 报价与合同 完整流程端到端验证（修正版：用正确的导航路径切换角色）
// 流程: 业务受理人员 CC06 编辑报价 -> 提交评审 -> CC07
//       -> 技术负责人 CC07 通过 -> CC06
//       -> 业务受理人员 CC03列表 -> CC05 -> CC06 客户确认 -> CC05 已受理
import { chromium } from 'playwright';
const BASE = 'http://localhost:8090/index.html';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  const log = (s) => console.log(s);
  const toast = async () => {
    await sleep(400);
    const t = await page.locator('.toast').last().textContent().catch(() => '');
    return (t || '').replace(/\s+/g, ' ').trim();
  };
  const h1 = async () => (await page.locator('h1').textContent() || '').trim();
  const assert = (cond, msg) => { log((cond ? '✅ PASS' : '❌ FAIL') + ': ' + msg); if (!cond) { errors.push('ASSERT FAIL: ' + msg); } };

  // 重置数据，确保初始状态
  await page.goto(`${BASE}`);
  await sleep(400);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/`);
  await sleep(700);

  // ===== 阶段1: 业务受理人员 - CC06 编辑报价 + 提交评审 =====
  log('=== 阶段1: 业务受理人员登录 ===');
  await page.locator('.role-card:has-text("业务受理人员")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);
  assert(await h1() === '综合工作台', '登录成功进入工作台');

  // 用 cm3（草稿种子数据）
  log('\n--- 进入 CC06 (cm3 草稿) ---');
  await page.goto(`${BASE}?ctx=cm3#/CC06`);
  await sleep(900);
  assert(await h1() === '报价与合同', '进入 CC06 报价与合同页');

  // 检查"提交合同评审"按钮样式（Bug1 验证）
  log('\n--- Bug1: 检查"提交合同评审"按钮样式 ---');
  const submitBtn = page.locator('.heading-actions button:has-text("提交合同评审")');
  assert(await submitBtn.count() === 1, '提交合同评审按钮存在');
  if (await submitBtn.count() > 0) {
    const bg = await submitBtn.evaluate(e => getComputedStyle(e).backgroundColor);
    const color = await submitBtn.evaluate(e => getComputedStyle(e).color);
    log('  背景色: ' + bg + ' / 文字色: ' + color);
    assert(bg !== 'rgb(255, 255, 255)', '按钮背景非白色（非白块）');
    assert(bg === 'rgb(16, 107, 100)' || bg === 'rgb(12, 88, 83)', '按钮背景为品牌色');
  }

  // 编辑报价
  log('\n--- 编辑报价（登记合同版本）---');
  await page.locator('.heading-actions button:has-text("编辑报价")').click();
  await sleep(400);
  await page.locator('[data-form-field="quotationAmount"]').fill('¥4,800');
  await page.locator('[data-form-field="contractVersion"]').fill('V1');
  await page.locator('[data-overlay="submit"]').click();
  await sleep(500);
  log('  Toast: ' + await toast());

  // 提交合同评审
  log('\n--- 提交合同评审 ---');
  await page.locator('.heading-actions button:has-text("提交合同评审")').click();
  await sleep(900);
  const submitToast = await toast();
  log('  Toast: ' + submitToast);
  assert(submitToast.includes('已提交合同评审'), '提交评审成功');
  assert(await h1() === '合同评审', '跳转到 CC07 合同评审');

  // ===== 阶段2: 切换技术负责人 - CC07 通过受理 =====
  log('\n=== 阶段2: 切换技术负责人 ===');
  // 退出
  await page.locator('button[data-action="logout"]').click();
  await sleep(400);
  await page.locator('[data-overlay="confirm"]').click();
  await sleep(600);
  // 选技术负责人
  await page.locator('.role-card:has-text("技术负责人")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);

  // 从委托列表进入 CC07（contextId 已被 resetSession 清空，需重新选择）
  log('\n--- 从 CC03 委托列表进入 cm3 的 CC07 ---');
  await page.goto(`${BASE}#/CC03`);
  await sleep(800);
  // 找到 cm3 对应行，点击"提交评审"或行操作进入详情
  // CC03 列表应有 cm3 的操作按钮
  const cm3Row = page.locator('tr:has-text("COMM-2026-0003")');
  log('  cm3 行 count: ' + await cm3Row.count());

  // 检查 CC03 的操作按钮
  const reviewBtn = page.locator('button:has-text("提交评审")').first();
  if (await reviewBtn.isVisible().catch(() => false)) {
    // cm3 已是待评审，CC03 可能不显示提交评审
    log('  CC03 有提交评审按钮');
  }

  // 用 ctx 参数重新进入 CC07（reload 方式让 ctx 生效）
  await page.goto(`${BASE}?ctx=cm3#/CC07`);
  await sleep(900);
  assert(await h1() === '合同评审', '进入 CC07');
  log('  CC07 h1: ' + await h1());

  // 通过受理
  log('\n--- 点击"通过受理" ---');
  const approveBtn = page.locator('button:has-text("通过受理")');
  assert(await approveBtn.count() === 1, '通过受理按钮存在（技术负责人可见）');
  if (await approveBtn.count() > 0) {
    await approveBtn.click();
    await sleep(900);
    const approveToast = await toast();
    log('  Toast: ' + approveToast);
    assert(approveToast.includes('评审完成'), '评审完成');
    assert(await h1() === '报价与合同', '评审通过后跳转 CC06');
    log('  跳转后 h1: ' + await h1() + ' / hash: ' + await page.evaluate(() => location.hash));
  }

  // ===== 阶段3: 切换业务受理人员 - CC06 客户确认生效 =====
  log('\n=== 阶段3: 切换业务受理人员做客户确认 ===');
  await page.locator('button[data-action="logout"]').click();
  await sleep(400);
  await page.locator('[data-overlay="confirm"]').click();
  await sleep(600);
  await page.locator('.role-card:has-text("业务受理人员")').click();
  await sleep(300);
  await page.locator('button:has-text("进入系统")').click();
  await sleep(500);

  // 切换角色后 contextId 被 resetSession 清空，需从委托列表重新进入
  log('\n--- 从 CC03 委托列表进入 cm3 详情 ---');
  await page.goto(`${BASE}#/CC03`);
  await sleep(800);
  // 点击 cm3 行的"详情"按钮
  const cm3DetailBtn = page.locator('tr:has-text("COMM-2026-0003") button:has-text("详情")');
  log('  详情按钮 count: ' + await cm3DetailBtn.count());
  if (await cm3DetailBtn.count() > 0) {
    await cm3DetailBtn.click();
    await sleep(700);
    log('  CC05 h1: ' + await h1());
  }

  // CC05 点"报价与合同"进入 CC06
  log('\n--- CC05 点击"报价与合同"进入 CC06 ---');
  const quoteBtn2 = page.locator('.heading-actions button:has-text("报价与合同")');
  log('  报价与合同按钮 count: ' + await quoteBtn2.count());
  if (await quoteBtn2.count() > 0) {
    await quoteBtn2.click();
    await sleep(700);
  }
  assert(await h1() === '报价与合同', '进入 CC06');
  log('  CC06 h1: ' + await h1());

  // 检查客户确认生效按钮（Bug1 再次验证）
  log('\n--- 检查"客户确认生效"按钮 ---');
  const confirmBtn = page.locator('.heading-actions button:has-text("客户确认生效")');
  assert(await confirmBtn.count() === 1, '客户确认生效按钮存在');
  if (await confirmBtn.count() > 0) {
    const bg = await confirmBtn.evaluate(e => getComputedStyle(e).backgroundColor);
    log('  背景色: ' + bg);
    assert(bg !== 'rgb(255, 255, 255)', '按钮背景非白色（非白块）');

    // 点击客户确认生效
    log('\n--- 点击"客户确认生效" ---');
    await confirmBtn.click();
    await sleep(900);
    const confirmToast = await toast();
    log('  Toast: ' + confirmToast);
    assert(confirmToast.includes('确认生效') || confirmToast.includes('已确认'), '客户确认成功');
    assert(await h1() === '委托详情', '确认后跳转 CC05');
  }

  // ===== 阶段4: 最终状态 - CC05 已受理 + 进入样品接收 =====
  log('\n=== 阶段4: 最终状态验证 ===');
  const sampleBtn = page.locator('.heading-actions button:has-text("进入样品接收")');
  assert(await sampleBtn.count() === 1, '进入样品接收按钮存在（已受理状态）');
  if (await sampleBtn.count() > 0) {
    const bg = await sampleBtn.evaluate(e => getComputedStyle(e).backgroundColor);
    log('  进入样品接收按钮背景色: ' + bg);
    assert(bg !== 'rgb(255, 255, 255)', '进入样品接收按钮非白块');
  }

  log('\n=== 测试结果 ===');
  log('错误数: ' + errors.length);
  if (errors.length) {
    log('错误详情:');
    errors.forEach(e => log('  - ' + e));
  } else {
    log('🎉 全部断言通过！');
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
