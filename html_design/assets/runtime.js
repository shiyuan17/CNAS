(() => {
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
