// 通用 UI 工具组件
// 字符串模板小工具，统一 UI 产出。复用 mvp_design 的约定并扩展。

export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

export function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

export function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

// 状态徽章：根据状态文本自动选择语义色
const StatusColorMap = {
  '草稿': 'muted', '待评审': 'warning', '评审通过': 'success', '已受理': 'success',
  '已变更': 'warning', '已撤销': 'muted', '已拒绝': 'danger',
  '待接收': 'muted', '隔离中': 'danger', '已接收': 'success', '已分样': 'brand',
  '已交接': 'brand', '已领用': 'info', '已归还': 'info', '留样中': 'warning', '已处置': 'muted',
  '待排程': 'muted', '待开工': 'warning', '执行中': 'brand', '异常暂停': 'danger',
  '待复核': 'warning', '已完成': 'success', '已退回': 'danger',
  '待审核': 'warning', '审核退回': 'danger', '待签发': 'warning', '签发退回': 'danger',
  '已签发': 'brand', '发布失败': 'danger', '已发布': 'success', '已召回': 'danger',
  '已更正': 'warning', '已归档': 'muted',
  '已锁定': 'info',
  '活跃': 'success', '暂停': 'warning', '停用': 'muted', '正常': 'success', '关注': 'warning', '异常': 'danger',
  '通过': 'success', '阻断': 'danger', '待校验': 'warning',
};

export function status(text, type) {
  const t = type || StatusColorMap[text] || 'info';
  return `<span class="status ${t}">${escapeHtml(text)}</span>`;
}

// 按钮
export function button(label, action, style = 'primary', iconName = '') {
  return `<button class="button ${style}" data-action="${action}">${iconName ? icon(iconName) : ''}<span>${escapeHtml(label)}</span></button>`;
}

export function linkButton(label, action, style = 'primary') {
  return `<button class="button link ${style}" data-action="${action}">${escapeHtml(label)}</button>`;
}

export function disabledButton(label, reason = '请先完成前置条件', style = 'secondary', iconName = '') {
  return `<button class="button ${style}" disabled title="${escapeHtml(reason)}">${iconName ? icon(iconName) : ''}<span>${escapeHtml(label)}</span></button>`;
}

// 页面标题区
export function heading(title, subtitle, breadcrumbParts, actions = '') {
  const crumbs = (breadcrumbParts || []).map((p, i) => {
    if (i === breadcrumbParts.length - 1) return `<span>${escapeHtml(p)}</span>`;
    if (typeof p === 'string') return `<span>${escapeHtml(p)}</span>`;
    return `<a href="#/${p.to}">${escapeHtml(p.label)}</a>`;
  }).join('<span>/</span>');
  return `<div class="breadcrumb"><span>CNAS LIMS</span><span>/</span>${crumbs}</div><div class="page-heading"><div><h1>${escapeHtml(title)}</h1><p class="page-subtitle">${escapeHtml(subtitle)}</p></div><div class="heading-actions">${actions}</div></div>`;
}

// 面板
export function panel(title, body, extra = '') {
  return `<section class="panel ${extra}"><h2 class="panel-title">${escapeHtml(title)}</h2>${body}</section>`;
}

// 面板带标题栏操作
export function panelWithActions(title, titleActions, body, extra = '') {
  return `<section class="panel ${extra}"><h2 class="panel-title">${escapeHtml(title)}<span class="heading-actions">${titleActions}</span></h2>${body}</section>`;
}

// 指标卡
export function metric(label, value, trend, trendType, iconName) {
  return `<div class="metric"><div class="metric-corner">${icon(iconName)}</div><span class="metric-label">${escapeHtml(label)}</span><strong class="metric-value">${escapeHtml(value)}</strong><small class="metric-trend ${trendType}">${escapeHtml(trend)}</small></div>`;
}

// 时间线
export function timeline(items) {
  if (!items || items.length === 0) return `<div class="empty-state">${icon('inbox')}<p>暂无记录</p></div>`;
  return `<div class="timeline">${items.map((item) => {
    const cls = item.state || (item.current ? 'current' : 'done');
    return `<div class="timeline-item ${cls}"><div class="tl-dot"></div><div class="tl-time">${escapeHtml(item.time)}</div><div class="tl-title">${escapeHtml(item.title || item.action)}</div><div class="tl-desc">${escapeHtml(item.detail || item.desc || '')}</div></div>`;
  }).join('')}</div>`;
}

// 步骤条
export function steps(stepNames, currentIndex) {
  return `<div class="steps">${stepNames.map((name, i) => {
    const stepNum = i + 1;
    const cls = i < currentIndex - 1 ? 'done' : i === currentIndex - 1 ? 'current' : '';
    const line = i < stepNames.length - 1 ? '<div class="step-line"></div>' : '';
    return `<div class="step ${cls}"><div class="step-dot">${stepNum}</div><span class="step-label">${escapeHtml(name)}</span></div>${line}`;
  }).join('')}</div>`;
}

// 数据表格
export function table(headers, rows, options = {}) {
  if (!rows || rows.length === 0) {
    return `<div class="empty-state">${icon('inbox')}<p>暂无数据</p></div>`;
  }
  const cols = headers.map((h) => `<th>${escapeHtml(h.label)}</th>`).join('');
  const body = rows.map((row) => {
    const cells = headers.map((h) => {
      const val = row[h.key];
      if (h.render) return `<td>${h.render(row)}</td>`;
      if (h.key === 'status' || h.key === 'cooperationStatus') return `<td>${status(val)}</td>`;
      return `<td>${escapeHtml(val ?? '')}</td>`;
    }).join('');
    return `<tr data-row-id="${escapeHtml(row.id || '')}">${cells}</tr>`;
  }).join('');
  return `<table class="data-table"><thead><tr>${cols}</tr></thead><tbody>${body}</tbody></table>`;
}

// 筛选条
export function filterBar(searchPlaceholder, statusOptions, extra = '') {
  const opts = statusOptions.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
  return `<div class="filter-bar">
    <input class="search-input" type="text" placeholder="${escapeHtml(searchPlaceholder)}" data-filter="search" />
    <select data-filter="status"><option value="">全部状态</option>${opts}</select>
    ${extra}
    <span class="result-count" data-result-count></span>
  </div>`;
}

// 键值对列表
export function kvList(fields, data) {
  return `<div class="kv-list">${fields.map((f) => {
    const val = data ? data[f.key] : '';
    return `<div class="kv-item"><span class="kv-label">${escapeHtml(f.label)}</span><span class="kv-value">${escapeHtml(val ?? '')}</span></div>`;
  }).join('')}</div>`;
}

// 告警条
export function alert(type, message, iconName) {
  const icons = { warning: 'alert-triangle', danger: 'alert-octagon', info: 'info', success: 'check-circle' };
  return `<div class="alert ${type}">${icon(iconName || icons[type])}<div>${message}</div></div>`;
}

// 关联链路
export function linkChain(nodes) {
  return `<div class="link-chain">${nodes.map((n, i) => {
    const arrow = i < nodes.length - 1 ? '<span class="link-arrow">→</span>' : '';
    return `<span class="link-node" data-view="${n.to}">${escapeHtml(n.label)}</span>${arrow}`;
  }).join('')}</div>`;
}

// 空状态
export function emptyState(message, iconName = 'inbox') {
  return `<div class="empty-state">${icon(iconName)}<p>${escapeHtml(message)}</p></div>`;
}

// 待办列表项
export function todoItem(todo) {
  const urgentCls = todo.priority === '紧急' ? 'urgent' : '';
  const iconMap = { '评审': 'file-check', '审批': 'pen-tool', '复核': 'clipboard-check', '签收': 'package-check', '处置': 'trash-2' };
  const iconName = iconMap[todo.type] || 'bell';
  return `<div class="todo-item ${urgentCls}" data-view="${todo.to || ''}">
    <div class="todo-icon">${icon(iconName)}</div>
    <div class="todo-body">
      <div class="todo-title">${escapeHtml(todo.title)}</div>
      <div class="todo-meta">${escapeHtml(todo.source)} · 到期 ${escapeHtml(todo.dueDate)}</div>
    </div>
    <div class="todo-priority">${status(todo.priority, todo.priority === '紧急' ? 'danger' : 'warning')}</div>
  </div>`;
}
