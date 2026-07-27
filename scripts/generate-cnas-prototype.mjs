import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { businessDomains } from './cnas-page-specs-business.mjs';
import { resourceDomains } from './cnas-page-specs-resources.mjs';
import { governanceDomains } from './cnas-page-specs-governance.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'html_design');
const PAGES_DIR = join(OUT, 'pages');
const flowNames = [
  '客户委托到任务受理', '样品接收到样品处置', '检测任务分配到结果审核', '原始记录到报告发布',
  '人员培训到岗位授权', '设备采购到报废', '文件编制到作废', '不符合项发现到整改关闭',
  '内审到整改验证', '管理评审到改进闭环', '能力验证计划到结果评价', 'CNAS 评审问题到整改完成',
];

const sourcePages = [...businessDomains, ...resourceDomains, ...governanceDomains]
  .flatMap(({ root, basename, pages }) => pages.map((page, index) => ({ ...page, root, basename, domainIndex: index })));
const flowPageIds = new Map([
  ['CC04', 'P01'], ['SM02', 'P02'], ['TM02', 'P03'], ['TM05', 'P04'],
  ['R04', 'P05'], ['R12', 'P06'], ['GOV02', 'P07'], ['Q09', 'P08'],
  ['GOV10', 'P09'], ['GOV13', 'P10'], ['Q05', 'P11'], ['ACC07', 'P12'],
]);
const resolveBackTarget = (page) => {
  const backText = page.back.includes('返回') ? page.back.slice(page.back.lastIndexOf('返回') + 2) : page.back;
  const choices = backText
    .split(/[或，、]/)
    .map(value => value.replace(/并保留.*$/, '').trim())
    .filter(Boolean);
  for (const choice of choices) {
    if (choice.includes('登录')) {
      const loginPage = sourcePages.find(candidate => candidate.title === '登录');
      if (loginPage) return loginPage;
    }
    const exactTitle = sourcePages.find(candidate => candidate.id !== page.id && candidate.title === choice.replace(/页$/, ''));
    if (exactTitle) return exactTitle;
    const exactMenu = sourcePages.find(candidate => candidate.id !== page.id && candidate.menu === choice);
    if (exactMenu) return exactMenu;
    const contains = sourcePages.find(candidate => candidate.id !== page.id && (candidate.title.includes(choice) || candidate.menu.includes(choice)));
    if (contains) return contains;
  }
  const sameRoot = sourcePages.find(candidate => candidate.id !== page.id && candidate.root === page.root && candidate.pageType === '入口页');
  return sameRoot || sourcePages.find(candidate => candidate.id !== page.id && candidate.root === page.root) || null;
};
const pages = sourcePages.map((page, index) => ({
  ...page,
  flowId: flowPageIds.get(page.id) ?? 'N/A',
  flowName: flowPageIds.has(page.id) ? flowNames[Number(flowPageIds.get(page.id).slice(1)) - 1] : '页面专属流程',
  mobile: page.id.startsWith('M'),
  backPageId: resolveBackTarget(page)?.id ?? null,
  backHref: resolveBackTarget(page) ? `${resolveBackTarget(page).id}.html` : `../index.html#${encodeURIComponent(page.root)}`,
  html: `pages/${page.id}.html`,
}));

const css = String.raw`/* CNAS LIMS prototype: shared visual tokens and responsive shell */
:root {
  --ink: #17343b; --muted: #688087; --teal: #0f5960; --teal-dark: #123f49;
  --teal-soft: #e8f3f3; --blue: #286fa8; --green: #2d8a68; --amber: #b97719;
  --red: #b84a4a; --paper: #ffffff; --work: #f3f6f7; --line: #dce6e8;
  --shadow: 0 10px 28px rgba(26, 64, 72, .08); --radius: 6px;
  font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
  color: var(--ink); background: var(--work); font-size: 14px;
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; background: var(--work); }
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .52; }
a { color: inherit; text-decoration: none; }
.app-shell { min-height: 100vh; display: flex; }
.side { width: 232px; flex: 0 0 232px; background: var(--teal-dark); color: #d8ebeb; padding: 18px 14px; }
.brand { display: flex; gap: 10px; align-items: center; color: white; font-weight: 750; letter-spacing: 0; margin: 2px 8px 24px; }
.brand-mark { width: 32px; height: 32px; display: grid; place-items: center; background: #2d8a83; border-radius: 6px; font-weight: 800; }
.brand small { display: block; color: #a7c7c8; font-size: 11px; font-weight: 500; margin-top: 3px; }
.nav-group { margin: 18px 0; }
.nav-label { color: #8eb1b3; font-size: 11px; margin: 0 8px 7px; text-transform: uppercase; }
.nav-link { display: flex; align-items: center; gap: 9px; border-radius: 5px; padding: 9px 10px; color: #c8dede; margin: 2px 0; }
.nav-link:hover, .nav-link.active { background: rgba(93, 173, 169, .2); color: white; }
.nav-dot { width: 6px; height: 6px; border-radius: 50%; background: #72bab3; }
.work { flex: 1; min-width: 0; }
.topbar { min-height: 64px; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; background: var(--paper); border-bottom: 1px solid var(--line); }
.topbar-title { font-size: 15px; font-weight: 650; }
.top-actions { display: flex; align-items: center; gap: 12px; color: var(--muted); }
.top-icon { border: 0; background: transparent; color: var(--muted); padding: 7px; }
.avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: #d9eceb; color: var(--teal); font-weight: 700; }
.content { max-width: 1440px; padding: 26px 30px 46px; margin: 0 auto; }
.crumbs { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
.crumbs span { margin: 0 6px; color: #a5b4b8; }
.page-head { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 22px; }
.page-head h1 { margin: 0; font-size: 26px; line-height: 1.25; letter-spacing: 0; }
.page-head p { max-width: 720px; color: var(--muted); line-height: 1.65; margin: 8px 0 0; }
.head-actions, .button-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.btn { border: 1px solid var(--line); border-radius: 5px; padding: 8px 13px; color: var(--ink); background: white; min-height: 36px; }
.btn:hover { border-color: #78aeb0; color: var(--teal); }
.btn.primary { color: white; background: var(--teal); border-color: var(--teal); }
.btn.warning { color: #85510e; background: #fff7e7; border-color: #efd39d; }
.btn.danger { color: #9c3c3c; background: #fff4f4; border-color: #e8b7b7; }
.btn.ghost { background: transparent; }
.statusbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; margin-bottom: 18px; background: white; border: 1px solid var(--line); border-left: 4px solid var(--teal); border-radius: var(--radius); box-shadow: var(--shadow); }
.state { font-weight: 700; color: var(--teal); }
.status-meta { color: var(--muted); font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.span-12 { grid-column: span 12; } .span-8 { grid-column: span 8; } .span-7 { grid-column: span 7; } .span-6 { grid-column: span 6; } .span-5 { grid-column: span 5; } .span-4 { grid-column: span 4; }
.panel { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); min-width: 0; }
.panel-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 16px 18px 13px; border-bottom: 1px solid var(--line); }
.panel-head h2 { font-size: 15px; margin: 0; }
.panel-body { padding: 18px; }
.muted { color: var(--muted); }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat { padding: 16px; background: white; border: 1px solid var(--line); border-radius: var(--radius); }
.stat-label { color: var(--muted); font-size: 12px; } .stat-value { font-size: 26px; font-weight: 750; color: var(--teal); margin: 8px 0 4px; }
.stat-note { color: var(--green); font-size: 12px; }
.field-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.field { min-width: 0; } .field label { display: block; color: var(--muted); font-size: 12px; margin-bottom: 7px; }
.field-value { min-height: 38px; padding: 9px 11px; background: #fbfcfc; border: 1px solid var(--line); border-radius: 4px; overflow-wrap: anywhere; line-height: 1.45; }
.field-value.long { min-height: 72px; }
.table-wrap { overflow-x: auto; } table { border-collapse: collapse; width: 100%; min-width: 620px; } th, td { padding: 12px 13px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; } th { color: var(--muted); background: #f8fafb; font-size: 12px; font-weight: 650; } td { color: #34515a; } tr:last-child td { border-bottom: 0; }
.tag { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 99px; font-size: 11px; background: var(--teal-soft); color: var(--teal); }
.tag.warn { background: #fff3d9; color: #986012; } .tag.red { background: #fff0f0; color: var(--red); } .tag.green { background: #e9f6ef; color: var(--green); }
.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; } .step { position: relative; padding: 12px 10px; border-top: 3px solid var(--line); color: var(--muted); } .step.active { border-color: var(--teal); color: var(--teal); font-weight: 700; } .step small { display: block; margin-top: 5px; font-weight: 400; }
.timeline { display: grid; gap: 0; } .timeline-item { position: relative; display: grid; grid-template-columns: 115px 1fr; gap: 14px; padding: 12px 0 12px 16px; border-left: 2px solid #c8dddd; } .timeline-item::before { content: ''; position: absolute; left: -6px; top: 17px; width: 10px; height: 10px; border-radius: 50%; background: var(--teal); } .timeline-time { color: var(--muted); font-size: 12px; }
.skeleton { height: 8px; width: 42%; border-radius: 4px; background: linear-gradient(90deg, #e4edef, #f6f9f9, #e4edef); margin-bottom: 9px; } .skeleton.short { width: 24%; }
.empty { padding: 18px; border: 1px dashed #b9cbce; color: var(--muted); text-align: center; border-radius: 5px; margin-top: 12px; }
.hint { border-left: 3px solid #a5cbca; background: #f2f9f8; color: #4e7174; padding: 11px 13px; line-height: 1.55; border-radius: 3px; }
.login { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #eaf2f2; } .login-card { width: min(420px, 100%); padding: 30px; background: white; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow); } .login-card .brand { color: var(--teal-dark); margin: 0 0 28px; } .login-card .brand small { color: var(--muted); }
.input { width: 100%; padding: 10px 11px; border: 1px solid var(--line); border-radius: 4px; } .form-row { display: grid; gap: 7px; margin: 15px 0; } .form-row label { font-size: 12px; color: var(--muted); }
.drawer, .modal-backdrop { display: none; } .drawer.open, .modal-backdrop.open { display: flex; } .drawer { position: fixed; z-index: 10; inset: 0 0 0 auto; width: min(520px, 100%); flex-direction: column; background: white; box-shadow: -12px 0 34px rgba(14, 53, 59, .18); } .drawer-head { padding: 18px 20px; display: flex; justify-content: space-between; border-bottom: 1px solid var(--line); } .drawer-head h2 { margin: 0; font-size: 17px; } .drawer-body { overflow: auto; padding: 20px; }
.modal-backdrop { position: fixed; z-index: 20; inset: 0; align-items: center; justify-content: center; padding: 20px; background: rgba(14, 45, 51, .38); } .modal { width: min(480px, 100%); padding: 20px; background: white; border-radius: 7px; box-shadow: var(--shadow); } .modal h2 { margin: 0 0 8px; font-size: 17px; } .modal textarea { width: 100%; min-height: 108px; resize: vertical; border: 1px solid var(--line); border-radius: 4px; padding: 10px; margin: 12px 0; }
.footer-note { margin-top: 22px; color: var(--muted); font-size: 12px; line-height: 1.55; }
@media (max-width: 1000px) { .content { padding: 22px 20px 38px; } .side { width: 210px; flex-basis: 210px; } .field-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .span-8, .span-7 { grid-column: span 12; } .span-5, .span-4 { grid-column: span 6; } }
@media (max-width: 800px) { .side { display: none; } .topbar { padding: 0 16px; } .content { padding: 18px 14px 32px; } .page-head { display: block; } .head-actions { margin-top: 15px; } .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .field-grid { grid-template-columns: 1fr; } .span-6, .span-5, .span-4 { grid-column: span 12; } .statusbar { align-items: flex-start; flex-direction: column; } .steps { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 430px) { .page-head h1 { font-size: 22px; } .topbar-title { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .top-actions .top-icon { display: none; } .stats { gap: 8px; } .stat { padding: 12px; } .stat-value { font-size: 22px; } }
`;

const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const favicon = String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0f5960"/><path d="M8 8h16v4H12v4h9v4h-9v4H8z" fill="#fff"/></svg>`;

const runtime = String.raw`(() => {
  const pages = globalThis.CNAS_PAGE_DATA || {};
  const pageId = document.body.dataset.pageId;
  const page = pages[pageId];
  if (!page) throw new Error('Unknown CNAS page: ' + pageId);
  const app = document.querySelector('#app');
  const key = 'cnas-prototype:' + page.id;
  const readState = () => {
    try { return { state: '正常', audit: [], notice: '', permissionDenied: false, ...(JSON.parse(localStorage.getItem(key)) || {}) }; }
    catch { return { state: '正常', audit: [], notice: '', permissionDenied: false }; }
  };
  let state = readState();
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
  const transitions = {
    '正常': { normal: '正常', return: '退回补充', block: '已阻断', close: '已关闭' },
    '退回补充': { normal: '正常', return: '退回补充', block: '已阻断', close: '已关闭' },
    '已阻断': { close: '已关闭' },
    '已关闭': {},
  };
  const record = (action, next, reason = '') => {
    if (action === 'permission-denied') {
      state = { ...state, permissionDenied: true, notice: '权限不足：当前角色无权执行该操作，后续业务操作已禁用。', audit: [...state.audit, { action, state: state.state, reason, at: stamp(), actor: '当前用户' }] };
      save(); render(); return;
    }
    if (state.permissionDenied && !['audit', 'detail'].includes(action)) {
      state = { ...state, notice: '权限不足：当前角色无权执行该操作，事项已保持原状态。' };
      save(); render(); return;
    }
    if (['audit', 'detail'].includes(action)) {
      state = { ...state, notice: '', audit: [...state.audit, { action, state: state.state, reason, at: stamp(), actor: '当前用户' }] };
      save(); render(); return;
    }
    if (!transitions[state.state]?.[action]) {
      state = { ...state, notice: '当前状态不允许执行该操作，事项已保持原状态。' };
      save(); render(); return;
    }
    state = { ...state, state: next, notice: '', audit: [...state.audit, { action, state: next, reason, at: stamp(), actor: '当前用户' }] };
    save(); render();
  };
  const loginStatus = () => state.loginStatus || '未登录';
  const recordLogin = (next, action, reason = '') => {
    if (loginStatus() === '账号锁定' && next !== '已登录') return;
    const attempts = action === 'login-failed' ? Number(state.loginAttempts || 0) + 1 : 0;
    state = { ...state, loginStatus: next, loginAttempts: attempts, notice: next === '认证失败' ? '认证失败：账号或密码不正确。' : next === '账号锁定' ? '账号已锁定，请联系系统管理员。' : '', audit: [...state.audit, { action, state: next, reason, at: stamp(), actor: '当前用户' }] };
    save(); render();
  };
  const valueFor = (field, index) => {
    const samples = ['CNAS-2026-' + String(index + 1).padStart(3, '0'), '已核验', '待处理', '质量负责人', '2026-07-28', '按授权范围展示', '具备审计追溯'];
    if (/编号|代码/.test(field)) return samples[0]; if (/状态|结论/.test(field)) return state.state === '正常' ? '进行中' : state.state; if (/人|负责人/.test(field)) return samples[3]; if (/日期|时间|期限/.test(field)) return samples[4]; return samples[(index + 1) % samples.length];
  };
  const fieldGrid = (fields) => '<div class="field-grid">' + fields.map((field, index) => '<div class="field" data-field="' + esc(field) + '"><label>' + esc(field) + '</label><div class="field-value' + (field.length > 12 ? ' long' : '') + '">' + esc(valueFor(field, index)) + '</div></div>').join('') + '</div>';
  const table = (fields) => '<div class="table-wrap"><table><thead><tr>' + fields.map(field => '<th data-field="' + esc(field) + '">' + esc(field) + '</th>').join('') + '<th>操作</th></tr></thead><tbody>' + [0, 1, 2, 3].map(row => '<tr>' + fields.map((field, index) => '<td>' + esc(valueFor(field, index + row)) + '</td>').join('') + '<td><button class="btn ghost" data-open-detail="' + esc(page.id) + '" data-detail-row="' + row + '">查看</button></td></tr>').join('') + '</tbody></table></div>';
  const panel = (title, body, extra = '') => '<section class="panel"><div class="panel-head"><h2>' + title + '</h2>' + extra + '</div><div class="panel-body">' + body + '</div></section>';
  const typeClass = ['list', 'listDrawer', 'todoList', 'messageCenter', 'search', 'queue', 'trace', 'tree', 'auditLog'].includes(page.kind) ? 'list' : page.kind;
  const loginBody = () => {
    const status = loginStatus();
    const locked = status === '账号锁定';
    const audit = state.audit.length ? state.audit.map(item => '<div class="timeline-item"><div class="timeline-time">' + esc(item.at) + '</div><div><strong>' + esc(item.state) + '</strong><div class="muted">' + esc(item.actor) + ' · ' + esc(item.reason || item.action) + '</div></div></div>').join('') : '<div class="empty">暂无登录审计记录</div>';
    return '<div class="login"><div class="login-card"><div class="brand"><span class="brand-mark">C</span><span>CNAS LIMS<small>实验室业务与质量管理平台</small></span></div><h1>' + esc(page.title) + '</h1><p class="muted">' + esc(page.goal) + '</p><div class="statusbar"><div><span>会话状态：</span><span class="state" id="login-state">' + esc(status) + '</span></div><div class="status-meta">失败 ' + esc(state.loginAttempts || 0) + ' / 3</div></div>' + (state.notice ? '<div class="hint denied" role="alert">' + esc(state.notice) + '</div>' : '') + '<div class="form-row"><label>账号</label><input class="input" placeholder="请输入账号"' + (locked ? ' disabled' : '') + ' /></div><div class="form-row"><label>密码</label><input class="input" type="password" placeholder="请输入密码"' + (locked ? ' disabled' : '') + ' /></div><div class="form-row"><label>验证码</label><input class="input" placeholder="请输入验证码"' + (locked ? ' disabled' : '') + ' /></div><div class="button-row"><button class="btn primary" data-login-action="success"' + (locked ? ' disabled' : '') + '>登录</button><button class="btn warning" data-login-action="fail"' + (locked ? ' disabled' : '') + '>模拟认证失败</button><button class="btn" data-permission-denied>权限校验</button><button class="btn" disabled>受限操作（权限不足）</button></div><a class="btn ghost" data-back href="' + esc(page.backHref || '../index.html') + '">返回目录</a><details open><summary>页面依据与登录审计</summary><p class="muted">进入：' + esc(page.entry) + '<br>返回：' + esc(page.back) + '<br>字段：' + esc(page.fields.join('、')) + '<br>需求：' + esc(page.requirement) + '</p><div class="timeline">' + audit + '</div></details></div></div>';
  };
  const primaryBody = () => {
    if (page.kind === 'login') return loginBody();
    if (page.kind === 'login') return '<div class="login"><div class="login-card"><div class="brand"><span class="brand-mark">C</span><span>CNAS LIMS<small>实验室业务与质量管理平台</small></span></div><h1>' + esc(page.title) + '</h1><p class="muted">' + esc(page.goal) + '</p><div class="form-row"><label>账号</label><input class="input" placeholder="请输入账号" /></div><div class="form-row"><label>密码</label><input class="input" type="password" placeholder="请输入密码" /></div><div class="form-row"><label>验证码</label><input class="input" placeholder="请输入验证码" /></div><button class="btn primary" style="width:100%" data-action="normal">登录</button><a class="btn ghost" href="' + esc(page.backHref || '../index.html') + '">返回目录</a><div class="footer-note">进入：' + esc(page.entry) + '<br>返回：' + esc(page.back) + '<br>字段：' + esc(page.fields.join('、')) + '<br>需求：' + esc(page.requirement) + '</div></div></div>';
    if (page.kind === 'dashboard' || page.kind === 'mobileDashboard') return '<div class="stats">' + page.fields.slice(0, 4).map((field, index) => '<div class="stat" data-field="' + esc(field) + '"><div class="stat-label">' + esc(field) + '</div><div class="stat-value">' + [12, 36, 8, 94][index] + '</div><div class="stat-note">较上期 +' + (index + 2) + '%</div></div>').join('') + '</div><div class="grid" style="margin-top:16px"><div class="span-8">' + panel('业务进度总览', table(page.fields.slice(0, Math.min(5, page.fields.length)))) + '</div><div class="span-4">' + panel('风险与提醒', '<div class="hint">' + esc(page.requirement) + '</div><div class="empty">当前筛选范围暂无新增异常</div>') + '</div></div>';
    if (['list', 'listDrawer', 'todoList', 'messageCenter', 'search', 'queue', 'trace', 'tree', 'auditLog', 'communication'].includes(typeClass)) return panel('数据列表', '<div class="button-row" style="margin-bottom:14px"><input class="input" style="max-width:280px" placeholder="输入关键词筛选" /><select class="input" style="max-width:150px"><option>全部状态</option><option>进行中</option><option>已完成</option></select><button class="btn primary">查询</button></div>' + table(page.fields));
    if (['wizard', 'contract', 'receive', 'startTask', 'import', 'calculation', 'reportEditor', 'form', 'version', 'correction', 'withdrawal', 'archive', 'delivery', 'label', 'aliquot', 'handover', 'storage', 'checkout', 'retention', 'disposal', 'schedule', 'record', 'closeout'].includes(typeClass)) return panel('信息填写与核对', '<div class="steps">' + ['准备', '填写', '复核', '提交'].map((step, index) => '<div class="step' + (index === 1 ? ' active' : '') + '">' + (index + 1) + '. ' + step + '<small>' + (index === 1 ? '当前处理' : '待进入') + '</small></div>').join('') + '</div><div style="height:18px"></div>' + fieldGrid(page.fields));
    if (['matrix', 'qualityChart', 'monitor', 'config', 'permission'].includes(typeClass)) return panel('配置与分析', '<div class="hint">' + esc(page.goal) + '</div><div style="height:14px"></div>' + table(page.fields));
    const timeline = '<div class="timeline">' + ['发起', '核验', '复核', '当前'].map((item, index) => '<div class="timeline-item"><div class="timeline-time">2026-07-' + String(25 + index).padStart(2, '0') + '</div><div><strong>' + item + '</strong><div class="muted">' + (index === 3 ? state.state : '已完成') + ' · ' + esc(page.role) + '</div></div></div>').join('') + '</div>';
    return '<div class="grid"><div class="span-7">' + panel('业务详情', fieldGrid(page.fields)) + '</div><div class="span-5">' + panel('处理轨迹', timeline) + '</div></div>';
  };
  const nav = [...new Set(Object.values(pages).map(item => item.root))].slice(0, 10).map(root => '<div class="nav-group"><div class="nav-label">' + esc(root) + '</div><a class="nav-link' + (page.root === root ? ' active' : '') + '" href="../index.html"><span class="nav-dot"></span>' + esc(page.root === root ? page.menu : root) + '</a></div>').join('');
  const drawer = '<aside class="drawer" aria-label="页面依据"><div class="drawer-head"><h2 id="drawer-title">页面依据与审计</h2><button class="btn ghost" data-close>关闭</button></div><div class="drawer-body"><div id="drawer-detail" hidden><h3>业务详情</h3><p class="hint">已打开第 ' + '0' + ' 行业务详情，字段与当前页面规格保持一致。</p>' + fieldGrid(page.fields) + '</div><div id="drawer-evidence"><h3>页面入口与返回</h3><p class="muted">进入：' + esc(page.entry) + '</p><p class="muted">返回：' + esc(page.back) + '</p><h3>需求来源</h3><p class="hint">' + esc(page.requirement) + '</p><h3>审计轨迹</h3><div id="audit-list">' + (state.audit.length ? state.audit.map(item => '<div class="timeline-item"><div class="timeline-time">' + esc(item.at) + '</div><div><strong>' + esc(item.state) + '</strong><div class="muted">' + esc(item.actor) + ' · ' + esc(item.reason || item.action) + '</div></div></div>').join('') : '<div class="empty">暂无操作记录</div>') + '</div></div></div></aside>';
  const modal = '<div class="modal-backdrop" role="dialog" aria-modal="true"><div class="modal"><h2 id="modal-title">补充处理意见</h2><p class="muted">该动作需要记录原因，提交后写入本地审计轨迹。</p><textarea placeholder="请输入原因（必填）"></textarea><div class="button-row" style="justify-content:flex-end"><button class="btn" data-cancel>取消</button><button class="btn primary" data-confirm>提交</button></div></div></div>';
  const render = () => {
    if (page.kind === 'login') { app.innerHTML = primaryBody(); bind(); return; }
    const terminal = state.state === '已关闭';
    const blocked = terminal || state.state === '已阻断';
    const permissionDenied = Boolean(state.permissionDenied);
    app.innerHTML = '<div class="app-shell"><aside class="side"><a class="brand" href="../index.html"><span class="brand-mark">C</span><span>CNAS LIMS<small>业务与质量管理平台</small></span></a>' + nav + '</aside><main class="work"><header class="topbar"><div class="topbar-title">' + esc(page.menu) + '</div><div class="top-actions"><button class="top-icon" aria-label="搜索">⌕</button><button class="top-icon" aria-label="消息">◌</button><button class="btn ghost" data-logout>退出登录</button><span class="avatar">用</span></div></header><div class="content"><div class="crumbs">' + esc(page.root) + '<span>/</span>' + esc(page.menu) + '<span>/</span>' + esc(page.title) + '</div><div class="page-head"><div><h1>' + esc(page.title) + '</h1><p>' + esc(page.goal) + '</p></div><div class="head-actions"><a class="btn ghost" data-back href="' + esc(page.backHref || '../index.html') + '">返回</a><button class="btn" data-open-evidence>查看页面依据</button><button class="btn" data-action="normal"' + (blocked || permissionDenied ? ' disabled' : '') + '>正常推进</button><button class="btn warning" data-action="return"' + (blocked || permissionDenied ? ' disabled' : '') + '>退回补充</button><button class="btn danger" data-action="block"' + (blocked || permissionDenied ? ' disabled' : '') + '>阻断处理</button><button class="btn" data-open-audit>审计轨迹</button><button class="btn" data-action="close"' + (terminal || permissionDenied ? ' disabled' : '') + '>关闭事项</button><button class="btn" data-permission-denied>权限校验</button><button class="btn" disabled>受限操作（权限不足）</button></div></div><div class="statusbar"><div><span>当前状态：</span><span class="state" id="state">' + esc(state.state) + '</span></div><div class="status-meta">角色：' + esc(page.role) + ' · ' + esc(page.flowId) + ' ' + esc(page.flowName) + '</div></div>' + (state.notice ? '<div class="hint denied" role="alert">' + esc(state.notice) + '</div>' : '') + '<div class="grid"><div class="span-12"><div class="skeleton" aria-label="加载状态"></div><div class="skeleton short" aria-hidden="true"></div>' + primaryBody() + '</div></div><div class="footer-note">字段：' + esc(page.fields.join('、')) + '<br>原型边界：本地状态与审计记录仅用于交互核验，不连接真实接口、认证或生产数据。需求引用：' + esc(page.requirement) + '</div><div class="empty">空态示例：暂无符合当前条件的数据</div></div></main></div>' + drawer + modal;
    bind();
  };
  const bind = () => {
    app.querySelectorAll('[data-open-detail]').forEach(button => button.addEventListener('click', () => {
      record('detail', state.state, '打开第 ' + (Number(button.dataset.detailRow || 0) + 1) + ' 行业务详情');
      const drawerElement = app.querySelector('.drawer');
      drawerElement.querySelector('#drawer-title').textContent = '业务详情';
      drawerElement.querySelector('#drawer-detail').hidden = false;
      drawerElement.querySelector('#drawer-evidence').hidden = true;
      drawerElement.querySelector('#drawer-detail .hint').textContent = '已打开第 ' + (Number(button.dataset.detailRow || 0) + 1) + ' 行业务详情，字段与当前页面规格保持一致。';
      drawerElement.classList.add('open');
    }));
    app.querySelectorAll('[data-open-audit]').forEach(button => button.addEventListener('click', () => { record('audit', state.state); app.querySelector('.drawer').classList.add('open'); }));
    app.querySelectorAll('[data-permission-denied]').forEach(button => button.addEventListener('click', () => record('permission-denied', state.state, '当前角色无权限执行该操作')));
    app.querySelectorAll('[data-login-action]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.loginAction === 'success') { recordLogin('已登录', 'login-success', '本地原型模拟认证成功'); window.location.href = 'WB02.html'; return; }
      const next = Number(state.loginAttempts || 0) + 1 >= 3 ? '账号锁定' : '认证失败';
      return recordLogin(next, 'login-failed', next === '账号锁定' ? '连续三次认证失败，账号锁定' : '本地原型模拟认证失败');
    }));
    app.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', () => {
      const loginKey = 'cnas-prototype:WB01';
      let loginState = { state: '正常', audit: [], notice: '', permissionDenied: false };
      try { loginState = { ...loginState, ...(JSON.parse(localStorage.getItem(loginKey)) || {}) }; } catch {}
      loginState = { ...loginState, loginStatus: '未登录', loginAttempts: 0, notice: '', permissionDenied: false, audit: [...loginState.audit, { action: 'logout', state: '未登录', reason: '用户退出登录', at: stamp(), actor: '当前用户' }] };
      localStorage.setItem(loginKey, JSON.stringify(loginState));
      window.location.href = 'WB01.html';
    }));
    app.querySelectorAll('[data-open-evidence]').forEach(button => button.addEventListener('click', () => {
      const drawerElement = app.querySelector('.drawer');
      drawerElement.querySelector('#drawer-title').textContent = '页面依据与审计';
      drawerElement.querySelector('#drawer-detail').hidden = true;
      drawerElement.querySelector('#drawer-evidence').hidden = false;
      drawerElement.classList.add('open');
    }));
    app.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('.drawer').classList.remove('open')));
    app.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'normal') return record('normal', '正常');
      if (action === 'close') return record('close', '已关闭');
      const modalElement = app.querySelector('.modal-backdrop'); modalElement.classList.add('open'); modalElement.dataset.action = action;
      modalElement.querySelector('textarea').focus();
    }));
    app.querySelectorAll('[data-cancel]').forEach(button => button.addEventListener('click', () => button.closest('.modal-backdrop').classList.remove('open')));
    app.querySelectorAll('[data-confirm]').forEach(button => button.addEventListener('click', () => { const modalElement = button.closest('.modal-backdrop'); const reason = modalElement.querySelector('textarea').value.trim(); if (!reason) { modalElement.querySelector('textarea').setCustomValidity('请输入原因'); modalElement.querySelector('textarea').reportValidity(); return; } const action = modalElement.dataset.action; modalElement.classList.remove('open'); record(action, action === 'return' ? '退回补充' : '已阻断', reason); }));
  };
  render();
})();
`;

const data = Object.fromEntries(pages.map(page => [page.id, page]));
const navRoots = [...new Set(pages.map(page => page.root))];
const indexCards = pages.map(page => `<a class="card" href="${page.html}" data-page-id="${page.id}"><div class="card-top"><span class="tag">${escapeHtml(page.id)}</span><span class="tag${page.mobile ? ' warn' : ''}">${page.mobile ? '移动端' : page.kind}</span></div><h2>${escapeHtml(page.title)}</h2><p>${escapeHtml(page.goal)}</p><div class="card-meta">${escapeHtml(page.root)} / ${escapeHtml(page.menu)}</div></a>`).join('\n');
const indexHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CNAS LIMS HTML 交互原型</title><link rel="stylesheet" href="assets/styles.css"></head><body><div class="app-shell"><aside class="side"><a class="brand" href="index.html"><span class="brand-mark">C</span><span>CNAS LIMS<small>页面原型目录</small></span></a>${navRoots.map(root => `<div class="nav-group"><div class="nav-label">${escapeHtml(root)}</div><a class="nav-link" href="#${escapeHtml(root)}"><span class="nav-dot"></span>页面清单</a></div>`).join('')}</aside><main class="work"><header class="topbar"><div class="topbar-title">CNAS HTML 交互原型</div><div class="top-actions"><span>136 个页面 · 130 桌面 · 6 移动</span><span class="avatar">原</span></div></header><div class="content"><div class="crumbs">原型目录 <span>/</span> 页面清单</div><div class="page-head"><div><h1>CNAS LIMS 交互原型</h1><p>基于现有页面规格的离线静态原型，覆盖页面字段、入口返回、流程状态、权限提示和审计轨迹。</p></div><div class="head-actions"><a class="btn primary" href="pages/WB02.html">打开工作台</a></div></div><div class="statusbar"><div><span>规格状态：</span><span class="state">136 页已映射</span></div><div class="status-meta">静态原型 · 本地 localStorage 状态</div></div><div class="cards">${indexCards}</div></div></main></div><style>.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.card{display:block;background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);min-width:0}.card:hover{border-color:#78aeb0;transform:translateY(-1px)}.card-top{display:flex;justify-content:space-between;gap:8px}.card h2{font-size:16px;margin:14px 0 8px;overflow-wrap:anywhere}.card p{color:var(--muted);font-size:12px;line-height:1.5;min-height:38px;margin:0 0 12px}.card-meta{color:#6e858b;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:1000px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:800px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){.cards{grid-template-columns:1fr}}</style></body></html>`;

const check = process.argv.includes('--check') || process.argv.includes('--check-generated');
if (!check) {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(PAGES_DIR, { recursive: true });
  await mkdir(join(OUT, 'assets'), { recursive: true });
  await writeFile(join(OUT, 'assets', 'styles.css'), css, 'utf8');
  await writeFile(join(OUT, 'assets', 'favicon.svg'), favicon, 'utf8');
  await writeFile(join(OUT, 'assets', 'runtime.js'), runtime, 'utf8');
  await writeFile(join(OUT, 'assets', 'page-data.js'), `globalThis.CNAS_PAGE_DATA = ${JSON.stringify(data)};\n`, 'utf8');
  await writeFile(join(OUT, 'prototype-manifest.json'), `${JSON.stringify({ version: 1, title: 'CNAS LIMS HTML 交互原型', pageCount: pages.length, desktopCount: pages.filter(page => !page.mobile).length, mobileCount: pages.filter(page => page.mobile).length, flowNames, pages }, null, 2)}\n`, 'utf8');
  await writeFile(join(OUT, 'index.html'), indexHtml.replace('<title>', '<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><title>'), 'utf8');
  for (const page of pages) {
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><title>${escapeHtml(page.id)} · ${escapeHtml(page.title)} · CNAS LIMS</title><link rel="stylesheet" href="../assets/styles.css"></head><body data-page-id="${escapeHtml(page.id)}" data-kind="${escapeHtml(page.kind)}"><div id="app"></div><script src="../assets/page-data.js"></script><script src="../assets/runtime.js"></script></body></html>`;
    await writeFile(join(PAGES_DIR, `${page.id}.html`), html, 'utf8');
  }
  console.log(`Generated ${pages.length} CNAS prototype pages in ${OUT}`);
} else {
  const manifest = JSON.parse(await readFile(join(OUT, 'prototype-manifest.json'), 'utf8'));
  const files = (await readdir(PAGES_DIR)).filter(name => name.endsWith('.html'));
  const missing = pages.filter(page => !files.includes(`${page.id}.html`)).map(page => page.id);
  const invalid = manifest.pages.length !== pages.length || files.length !== pages.length || missing.length;
  if (invalid) { console.error(JSON.stringify({ expected: pages.length, manifest: manifest.pages.length, files: files.length, missing }, null, 2)); process.exit(1); }
  console.log(`CNAS prototype generation check passed: ${pages.length} pages, ${pages.filter(page => !page.mobile).length} desktop, ${pages.filter(page => page.mobile).length} mobile.`);
}
