// 应用骨架：侧栏 + 顶栏 + 内容区
// 首次注入后，切换页面只重绘 #page-content 区域。

import { NavigationGroups } from '../config/navigation.js';
import { getSession, getData } from '../state/store.js';
import { icon, $, $$ } from './components.js';

// 渲染侧栏
function renderSidebar(currentView) {
  const groups = NavigationGroups.map((group) => {
    const items = group.items.map((item) => {
      const [pageId, label, iconName, visible] = item;
      const active = pageId === currentView ? 'active' : '';
      return `<button class="nav-item ${active}" data-view="${pageId}">${icon(iconName)}<span>${label}</span></button>`;
    }).join('');
    return `<div class="nav-group"><span class="nav-group-title">${group.title}</span>${items}</div>`;
  }).join('');

  return `<aside class="sidebar">
    <div class="brand"><div class="brand-mark">L</div><span>CNAS LIMS</span></div>
    <nav class="navigation">${groups}</nav>
    <div class="sidebar-footer">${icon('info')}<span>候选原型 v0.1</span></div>
  </aside>`;
}

// 渲染顶栏
function renderTopbar() {
  const session = getSession();
  const data = getData();
  const todoCount = 0; // 后续由待办逻辑计算
  const roleInitial = session.role ? session.role.charAt(0) : '?';

  return `<header class="topbar">
    <div class="search">${icon('search')}<input type="text" placeholder="搜索业务编号、客户名称..." /></div>
    <div class="top-actions">
      <button class="icon-button" data-view="WB03">${icon('bell')}<span class="notice-dot"></span></button>
      <div class="current-user">
        <div class="avatar">${roleInitial}</div>
        <div><strong>${session.role || '未登录'}</strong><span>演示账号</span></div>
      </div>
      <button class="button secondary" data-action="logout">${icon('log-out')}<span>退出</span></button>
    </div>
  </header>`;
}

// 注入应用骨架（仅首次）
export function mountShell(currentView) {
  const app = $('#app');
  app.innerHTML = `<div class="app-shell">
    ${renderSidebar(currentView)}
    <div class="main-area">
      ${renderTopbar()}
      <main class="page-content" id="page-content" tabindex="-1"></main>
    </div>
  </div>`;
}

// 更新侧栏高亮（切页时调用，避免重绘整个骨架）
export function updateSidebarActive(currentView) {
  $$('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === currentView);
  });
}

// 仅重绘内容区
export function updateContent(html) {
  const content = $('#page-content');
  if (content) {
    content.innerHTML = html;
    content.focus({ preventScroll: true });
  }
}
