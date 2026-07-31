// 应用入口：初始化、路由监听、事件委托、首次渲染

import { getSession, getData, updateSession, resetSession, setCollection, appendAudit, saveState } from './state/store.js';
import { getSeedData } from './state/seed.js';
import { NavigationGroups, NavPageIds, DEFAULT_PAGE } from './config/navigation.js';
import { Pages, getPage } from './config/pages.js';
import { Roles, DEFAULT_ROLE } from './config/roles.js';
import { mountShell, updateSidebarActive, updateContent } from './ui/shell.js';
import { $, $$, icon, escapeHtml, refreshIcons, button } from './ui/components.js';
import { toast, openModal, closeDrawer } from './ui/overlay.js';
import { registerRenderers, renderPage } from './ui/renderers.js';
import { go } from './ui/router.js';
import { renderWB02, renderWB03, renderAudit } from './pages/workbench.js';
import { renderCustomerPage } from './pages/customer.js';
import { renderSamplePage } from './pages/sample.js';
import { renderTestingPage } from './pages/testing.js';
import { renderReportPage } from './pages/report.js';

// ===== 初始化种子数据（仅首次） =====
function initSeedData() {
  const data = getData();
  if (data.customers.length === 0) {
    const seed = getSeedData();
    Object.entries(seed).forEach(([key, items]) => {
      setCollection(key, items);
    });
  }
}

// ===== 注册渲染器 =====
function registerAllRenderers() {
  registerRenderers({
    WB02: renderWB02,
    WB03: renderWB03,
    AUDIT: renderAudit,
  });
  // CC 系列页面统一路由到客户模块渲染器
  ['CC01', 'CC02', 'CC03', 'CC04', 'CC05', 'CC06', 'CC07', 'CC08', 'CC09'].forEach((id) => {
    registerRenderers({ [id]: renderCustomerPage });
  });
  // SM 系列页面统一路由到样品模块渲染器
  ['SM01', 'SM02', 'SM03', 'SM04', 'SM05', 'SM06', 'SM07', 'SM08', 'SM09', 'SM10', 'SM11', 'SM12'].forEach((id) => {
    registerRenderers({ [id]: renderSamplePage });
  });
  // TM 系列页面统一路由到检测模块渲染器
  ['TM01', 'TM02', 'TM03', 'TM04', 'TM05', 'TM06', 'TM07', 'TM08', 'TM09', 'TM10', 'TM11', 'TM12', 'TM13', 'TM14'].forEach((id) => {
    registerRenderers({ [id]: renderTestingPage });
  });
  // RM 系列页面统一路由到报告模块渲染器
  ['RM01', 'RM02', 'RM03', 'RM04', 'RM05', 'RM06', 'RM07', 'RM08', 'RM09', 'RM10', 'RM11'].forEach((id) => {
    registerRenderers({ [id]: renderReportPage });
  });
}

// ===== 渲染登录页 =====
function renderLogin() {
  const session = getSession();
  const rolesHtml = Roles.map((r, i) => {
    const active = r.name === session.role ? 'active' : '';
    return `<button class="role-card ${active}" data-role="${escapeHtml(r.name)}">${icon(r.icon)}<strong>${escapeHtml(r.name)}</strong><span>${escapeHtml(r.desc)}</span>${active ? `<span class="role-check">${icon('check')}</span>` : ''}</button>`;
  }).join('');

  $('#app').innerHTML = `<div class="login-shell">
    <div class="login-brand">
      <div>
        <h1>CNAS LIMS 核心主流程仿真原型</h1>
        <p>覆盖委托受理 -> 样品生命周期 -> 检测执行 -> 报告发布完整主链，含状态流转、权限校验与审计留痕。</p>
      </div>
      <div class="login-points">
        <div class="login-point">${icon('git-branch')}<span>P01-P04 四条主流程全节点</span></div>
        <div class="login-point">${icon('shield-check')}<span>集中式状态机 + 职责分离校验</span></div>
        <div class="login-point">${icon('history')}<span>操作审计自动留痕</span></div>
        <div class="login-point">${icon('database')}<span>可CRUD数据集合 + localStorage 持久化</span></div>
      </div>
      <div class="login-footer">候选仿真原型 · 非合规依据 · 虚构数据</div>
    </div>
    <div class="login-main">
      <div class="login-card">
        <h2>选择演示角色</h2>
        <p>不同角色拥有不同流程的操作权限，切换角色可体验职责分离校验。</p>
        <div class="role-cards">${rolesHtml}</div>
        <div class="login-actions">
          <small>本地演示，无需密码</small>
          ${button('进入系统', 'login', 'primary', 'log-in')}
        </div>
      </div>
    </div>
  </div>`;
  refreshIcons();
}

// ===== 主渲染函数 =====
let currentView = DEFAULT_PAGE;

function render() {
  const session = getSession();
  if (!session.loggedIn) {
    renderLogin();
    return;
  }

  // 每次渲染都从 URL 同步上下文 ID（支持 ?ctx=xxx 在 hash 导航后生效）
  const ctxParam = new URLSearchParams(location.search).get('ctx');
  if (ctxParam && session.currentContextId !== ctxParam) {
    // 直接写入 session 并持久化，不通过 updateSession 避免触发 notify 循环
    session.currentContextId = ctxParam;
    saveState();
  }

  // 首次注入骨架
  if (!$('#app .app-shell')) {
    mountShell(currentView);
  }

  // 解析当前路由
  currentView = getPathView();
  updateSidebarActive(currentView);

  // 渲染页面内容
  const html = renderPage(currentView, { currentView, contextId: session.currentContextId });
  updateContent(html);
  refreshIcons();
}

// 路由解析
function getPathView() {
  const hash = location.hash.replace('#/', '');
  if (!hash) return DEFAULT_PAGE;
  // 允许所有已注册页面（含隐藏操作页）
  if (getPage(hash)) return hash;
  if (NavPageIds.has(hash)) return hash;
  return DEFAULT_PAGE;
}

// ===== 路由导航（从 router.js 导入 go）=====

// 沿事件路径向上查找匹配元素（通过 getAttribute，兼容 IAB 环境）
function findActionTarget(target, attrName) {
  let node = target;
  while (node && node !== document) {
    if (node.getAttribute && node.getAttribute(attrName)) return node;
    node = node.parentNode;
  }
  return null;
}

// ===== 事件委托 =====
document.addEventListener('click', (event) => {
  // 导航
  const navTarget = findActionTarget(event.target, 'data-view');
  if (navTarget) {
    const view = navTarget.getAttribute('data-view');
    if (view) {
      // 提取并保存上下文 ID（用于详情页知道用户选了哪个对象）
      const contextId = navTarget.getAttribute('data-context-id');
      if (contextId) updateSession({ currentContextId: contextId });
      go(view);
      return;
    }
  }

  // 动作
  const actionTarget = findActionTarget(event.target, 'data-action');
  if (actionTarget) {
    const contextId = actionTarget.getAttribute('data-context-id');
    if (contextId) updateSession({ currentContextId: contextId });
    handleAction(actionTarget.getAttribute('data-action'), actionTarget);
    return;
  }

  // 行操作（data-row-action）
  const rowAction = findActionTarget(event.target, 'data-row-action');
  if (rowAction) {
    handleRowAction(rowAction);
    return;
  }
});

// 全局动作处理
function handleAction(action, el) {
  switch (action) {
    case 'login':
      updateSession({ loggedIn: true });
      appendAudit({ action: '登录', detail: `角色 ${getSession().role} 登录系统` });
      location.hash = `#/${DEFAULT_PAGE}`;
      render();
      break;

    case 'logout':
      openModal('退出登录', '确定要退出当前演示会话吗？本地数据将保留。', '退出', () => {
        resetSession();
        closeDrawer();
        render();
      }, true);
      break;

    case 'reset-data':
      openModal('重置演示数据', '将清空所有本地业务数据并恢复初始种子数据，确定继续吗？', '重置', () => {
        const seed = getSeedData();
        Object.entries(seed).forEach(([key, items]) => setCollection(key, items));
        toast('已重置', '演示数据已恢复初始状态', 'success');
        render();
      }, true);
      break;

    default:
      // 交给页面级动作处理器（通过自定义事件）
      document.dispatchEvent(new CustomEvent('cnas:action', { detail: { action, el } }));
  }
}

// 行操作处理
function handleRowAction(el) {
  const action = el.dataset.rowAction;
  const rowId = el.dataset.rowId;
  document.dispatchEvent(new CustomEvent('cnas:row-action', { detail: { action, rowId, el } }));
}

// ===== 角色选择（登录页） =====
document.addEventListener('click', (event) => {
  const roleCard = findActionTarget(event.target, 'data-role');
  if (roleCard) {
    updateSession({ role: roleCard.getAttribute('data-role') });
    renderLogin();
  }
});

// ===== 路由监听 =====
window.addEventListener('hashchange', render);
document.addEventListener('cnas:navigate', render);

// ===== 启动 =====
initSeedData();
registerAllRenderers();
if (!getSession().loggedIn) {
  // 设置默认角色
  updateSession({ role: DEFAULT_ROLE });
  // 演示自动登录（URL 参数 ?autologin=1），方便测试时绕过登录点击
  if (new URLSearchParams(location.search).get('autologin') === '1') {
    updateSession({ loggedIn: true });
    appendAudit({ action: '自动登录', detail: `角色 ${DEFAULT_ROLE} 通过 autologin 参数登录` });
  }
}
render();
