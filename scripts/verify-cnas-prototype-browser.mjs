import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PROTOTYPE_DIR = join(ROOT, 'html_design');
const ARTIFACT_DIR = join(ROOT, '.cognis', 'artifacts', 'playwright', 'cnas-prototype-001');
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
const playwrightRequire = createRequire(join(ROOT, '.agents', 'cognis', 'tools', 'playwright-cli', 'package.json'));
const { chromium } = playwrightRequire('playwright');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const file = resolve(PROTOTYPE_DIR, requested);
      if (file !== PROTOTYPE_DIR && !file.startsWith(`${PROTOTYPE_DIR}${sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const fileStat = await stat(file);
      if (!fileStat.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'Content-Type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  return new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
  });
}

const manifest = JSON.parse(await readFile(join(PROTOTYPE_DIR, 'prototype-manifest.json'), 'utf8'));
const report = {
  tool: 'project-managed Playwright Chromium',
  startedAt: new Date().toISOString(),
  productPages: { expected: 136, opened: 0, passed: 0 },
  flows: [],
  viewports: [],
  console: [],
  pageErrors: [],
  requestFailures: [],
  responseFailures: [],
  errors: [],
};
await mkdir(ARTIFACT_DIR, { recursive: true });
const server = await startStaticServer();
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
let browser;

try {
  browser = await chromium.launch({ headless: true });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') report.console.push({ type: message.type(), text: message.text(), url: page.url() });
  });
  page.on('pageerror', (error) => report.pageErrors.push({ message: error.message, url: page.url() }));
  page.on('requestfailed', (request) => report.requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', (response) => {
    if (response.status() >= 400) report.responseFailures.push({ url: response.url(), status: response.status() });
  });

  const indexResponse = await page.goto(`${baseUrl}/index.html`, { waitUntil: 'load' });
  if (!indexResponse?.ok()) throw new Error(`Prototype index returned ${indexResponse?.status() ?? 'no response'}`);
  if (await page.locator('.cards a').count() !== 136) throw new Error('Prototype index does not link to 136 product pages');

  for (const item of manifest.pages) {
    report.productPages.opened += 1;
    const response = await page.goto(`${baseUrl}/${item.html}`, { waitUntil: 'load' });
    if (!response?.ok()) throw new Error(`${item.id} returned ${response?.status() ?? 'no response'}`);
    await page.locator('#app h1').waitFor({ state: 'visible' });
    const actual = await page.locator('body').getAttribute('data-page-id');
    const title = (await page.locator('#app h1').textContent())?.trim();
    const appText = (await page.locator('#app').textContent())?.trim() ?? '';
    if (actual !== item.id || title !== item.title || appText.length < 100) throw new Error(`${item.id} rendered contract mismatch`);
    const missingFields = item.fields.filter((field) => !appText.includes(field));
    if (missingFields.length) throw new Error(`${item.id} missing rendered fields: ${missingFields.join(', ')}`);
    const backHref = await page.locator('[data-back]').getAttribute('href');
    if (backHref !== item.backHref) throw new Error(`${item.id} backHref mismatch: ${backHref} !== ${item.backHref}`);
    report.productPages.passed += 1;
  }

  const login = manifest.pages.find((candidate) => candidate.kind === 'login');
  await page.goto(`${baseUrl}/${login.html}`, { waitUntil: 'load' });
  await page.evaluate((pageId) => localStorage.removeItem(`cnas-prototype:${pageId}`), login.id);
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('button', { name: '权限校验' }).click();
  if (!(await page.getByRole('alert').textContent())?.includes('权限不足')) throw new Error('Login permission denial feedback missing');
  await page.getByRole('button', { name: '模拟认证失败' }).click();
  await page.getByRole('button', { name: '模拟认证失败' }).click();
  await page.getByRole('button', { name: '模拟认证失败' }).click();
  if ((await page.locator('#login-state').textContent())?.trim() !== '账号锁定') throw new Error('Login lockout state missing');
  const lockedLogin = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), login.id);
  if (lockedLogin.audit.map((entry) => entry.action).join(',') !== 'permission-denied,login-failed,login-failed,login-failed') throw new Error('Login failure audit sequence mismatch');
  await page.evaluate((pageId) => localStorage.removeItem(`cnas-prototype:${pageId}`), login.id);
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL('**/WB02.html');
  const successfulLogin = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), login.id);
  if (successfulLogin.loginStatus !== '已登录' || successfulLogin.audit.at(-1)?.action !== 'login-success') throw new Error('Login success state or audit missing');
  await page.getByRole('button', { name: '退出登录' }).click();
  await page.waitForURL('**/WB01.html');
  const loggedOut = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), login.id);
  if (loggedOut.loginStatus !== '未登录' || loggedOut.audit.at(-1)?.action !== 'logout') throw new Error('Logout did not clear login session');

  const stateProbe = manifest.pages.find((candidate) => candidate.id === 'WB02');
  await page.goto(`${baseUrl}/${stateProbe.html}`, { waitUntil: 'load' });
  await page.evaluate((pageId) => localStorage.removeItem(`cnas-prototype:${pageId}`), stateProbe.id);
  await page.reload({ waitUntil: 'load' });
  await page.locator('[data-open-detail]').first().click();
  await page.locator('.drawer.open #drawer-detail').waitFor({ state: 'visible' });
  const detailState = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), stateProbe.id);
  if (detailState.audit.at(-1)?.action !== 'detail' || (await page.locator('#drawer-title').textContent())?.trim() !== '业务详情') throw new Error('List detail drill-down did not open an audited detail drawer');
  await page.locator('.drawer [data-close]').click();
  await page.evaluate((pageId) => localStorage.removeItem(`cnas-prototype:${pageId}`), stateProbe.id);
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('button', { name: '权限校验' }).click();
  const permissionState = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), stateProbe.id);
  if (permissionState.audit.at(-1)?.action !== 'permission-denied' || !permissionState.permissionDenied || !(await page.getByRole('alert').textContent())?.includes('权限不足')) throw new Error('Permission denial was not audited');
  if (!(await page.locator('[data-action="normal"]').isDisabled()) || !(await page.locator('[data-action="close"]').isDisabled()) || !(await page.locator('[data-logout]').count())) throw new Error('Permission denial did not disable business actions');
  const beforeRejectedAction = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), stateProbe.id);
  await page.locator('[data-action="normal"]').evaluate((button) => button.click());
  const afterRejectedAction = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), stateProbe.id);
  if (afterRejectedAction.state !== beforeRejectedAction.state || afterRejectedAction.audit.length !== beforeRejectedAction.audit.length || !(await page.locator('[data-action="normal"]').isDisabled())) throw new Error('Permission-denied state accepted a normal transition');
  await page.evaluate((pageId) => localStorage.removeItem(`cnas-prototype:${pageId}`), stateProbe.id);
  await page.reload({ waitUntil: 'load' });
  await page.getByRole('button', { name: '关闭事项' }).click();
  const beforeClosedAction = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), stateProbe.id);
  await page.locator('[data-action="normal"]').evaluate((button) => button.click());
  const afterClosedAction = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), stateProbe.id);
  if (afterClosedAction.state !== '已关闭' || afterClosedAction.audit.length !== beforeClosedAction.audit.length || !(await page.locator('[data-action="normal"]').isDisabled())) throw new Error('Closed state accepted a normal transition');

  const mobileWorkbench = manifest.pages.find((candidate) => candidate.id === 'M01');
  if (mobileWorkbench.backPageId !== 'WB01' || mobileWorkbench.backHref !== 'WB01.html') throw new Error('M01 does not return to the shared responsive login page');

  for (const flowId of Array.from({ length: 12 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`)) {
    const item = manifest.pages.find((candidate) => candidate.pageType === '操作页' && String(candidate.flowId).split('/').includes(flowId))
      ?? manifest.pages.find((candidate) => String(candidate.flowId).split('/').includes(flowId));
    if (!item) throw new Error(`${flowId} has no representative page`);
    await page.goto(`${baseUrl}/${item.html}`, { waitUntil: 'load' });
    await page.evaluate((pageId) => localStorage.removeItem(`cnas-prototype:${pageId}`), item.id);
    await page.reload({ waitUntil: 'load' });
    await page.getByRole('button', { name: '查看页面依据' }).click();
    await page.locator('.drawer.open').waitFor({ state: 'visible' });
    await page.locator('.drawer [data-close]').click();
    await page.getByRole('button', { name: '正常推进' }).click();
    await page.getByRole('button', { name: '退回补充' }).click();
    await page.locator('.modal textarea').fill(`${flowId} 退回原因核验`);
    await page.locator('.modal [data-confirm]').click();
    await page.getByRole('button', { name: '阻断处理' }).click();
    await page.locator('.modal textarea').fill(`${flowId} 阻断原因核验`);
    await page.locator('.modal [data-confirm]').click();
    const blocked = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), item.id);
    if (blocked.state !== '已阻断' || !(await page.locator('[data-action="normal"]').isDisabled()) || !(await page.locator('[data-action="return"]').isDisabled()) || !(await page.locator('[data-action="block"]').isDisabled())) throw new Error(`${flowId} blocked state did not disable illegal transitions`);
    await page.locator('[data-action="normal"]').evaluate((button) => button.click());
    const afterBlockedReject = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), item.id);
    if (afterBlockedReject.state !== '已阻断' || afterBlockedReject.audit.length !== blocked.audit.length) throw new Error(`${flowId} blocked state accepted a normal transition`);
    await page.getByRole('button', { name: '审计轨迹' }).click();
    await page.locator('.drawer.open #audit-list').waitFor({ state: 'visible' });
    await page.locator('.drawer [data-close]').click();
    await page.getByRole('button', { name: '关闭事项' }).click();
    const stored = await page.evaluate((pageId) => JSON.parse(localStorage.getItem(`cnas-prototype:${pageId}`)), item.id);
    if (stored.state !== '已关闭' || stored.audit.length !== 5) throw new Error(`${flowId} state machine did not persist five transitions`);
    const actionSequence = stored.audit.map((entry) => entry.action).join(',');
    if (actionSequence !== 'normal,return,block,audit,close') throw new Error(`${flowId} audit sequence mismatch: ${actionSequence}`);
    if (stored.audit.find((entry) => entry.action === 'return')?.reason !== `${flowId} 退回原因核验`) throw new Error(`${flowId} return reason was not audited`);
    if (stored.audit.find((entry) => entry.action === 'block')?.reason !== `${flowId} 阻断原因核验`) throw new Error(`${flowId} block reason was not audited`);
    await page.reload({ waitUntil: 'load' });
    const persisted = await page.locator('#state').textContent();
    if (persisted?.trim() !== '已关闭') throw new Error(`${flowId} closed state did not survive reload`);
    report.flows.push({ flowId, pageId: item.id, states: ['normal', 'return', 'block', 'audit', 'close'], persisted: true });
  }

  const viewportChecks = [
    { width: 1440, height: 900, pageId: 'WB02', name: 'desktop-1440' },
    { width: 1280, height: 800, pageId: 'CC01', name: 'desktop-1280' },
    { width: 390, height: 844, pageId: 'M01', name: 'mobile-390' },
  ];
  for (const viewport of viewportChecks) {
    const item = manifest.pages.find((candidate) => candidate.id === viewport.pageId);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${baseUrl}/${item.html}`, { waitUntil: 'load' });
    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      sidebarDisplay: getComputedStyle(document.querySelector('.side')).display,
      skeletonVisible: Boolean(document.querySelector('.skeleton')?.getClientRects().length),
      emptyVisible: Boolean(document.querySelector('.empty')?.getClientRects().length),
      disabled: document.querySelector('button[disabled]')?.disabled === true,
    }));
    if (layout.scrollWidth > layout.clientWidth + 1) throw new Error(`${viewport.name} has document-level horizontal overflow`);
    if (!layout.skeletonVisible || !layout.emptyVisible || !layout.disabled) throw new Error(`${viewport.name} is missing loading, empty, or disabled state`);
    if (viewport.width <= 800 ? layout.sidebarDisplay !== 'none' : layout.sidebarDisplay === 'none') throw new Error(`${viewport.name} sidebar responsive state is incorrect`);
    const screenshot = join(ARTIFACT_DIR, `${viewport.name}-${viewport.pageId}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    report.viewports.push({ ...viewport, screenshot: relative(ROOT, screenshot).replaceAll('\\', '/'), layout });
  }

  if (report.console.length || report.pageErrors.length || report.requestFailures.length || report.responseFailures.length) {
    throw new Error('Browser emitted console, page, request, or response failures');
  }
  await context.close();
} catch (error) {
  report.errors.push(error.stack ?? error.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolvePromise) => server.close(resolvePromise));
  report.finishedAt = new Date().toISOString();
  report.status = report.errors.length ? 'failed' : 'passed';
  await writeFile(join(ARTIFACT_DIR, 'browser-verification.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

if (report.errors.length) {
  console.error(report.errors.join('\n'));
} else {
  console.log(`Playwright verified ${report.productPages.passed} pages, ${report.flows.length} flows, and ${report.viewports.length} viewports.`);
}
