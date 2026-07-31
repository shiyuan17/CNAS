// 工作台页面渲染（WB02 综合工作台、WB03 我的待办、AUDIT 审计轨迹）
// 批次2 实现，属于 P01 批次但工作台是入口，先在基座后实现。

import { getData, getSession } from '../state/store.js';
import { ObjectTypes } from '../data/schema.js';
import { list } from '../data/repository.js';
import { FlowCatalog, findFlowByPage, getStepIndex } from '../flow/flow-catalog.js';
import { Pages } from '../config/pages.js';
import {
  $, $$, icon, escapeHtml, refreshIcons, button, status, heading, panel, panelWithActions,
  metric, timeline, steps, table, filterBar, kvList, alert, linkChain, emptyState, todoItem,
} from '../ui/components.js';
import { toast, openModal, openForm, openDrawer, closeDrawer } from '../ui/overlay.js';
import { go } from '../ui/router.js';

// WB02 综合工作台
export function renderWB02(ctx) {
  const data = getData();
  const pendingCommissions = data.commissions.filter((c) => ['草稿', '待评审'].includes(c.status)).length;
  const pendingSamples = data.samples.filter((s) => s.status === '待接收').length;
  const activeTasks = data.tasks.filter((t) => ['待开工', '执行中', '待复核'].includes(t.status)).length;
  const pendingReports = data.reports.filter((r) => ['草稿', '待审核', '待签发'].includes(r.status)).length;

  const metricsHtml = `
    ${metric('待办数量', '8', '3项紧急', 'danger', 'bell')}
    ${metric('进行中委托', String(pendingCommissions), '待评审/草稿', 'warning', 'files')}
    ${metric('待接收样品', String(pendingSamples), '需及时处理', 'warning', 'package')}
    ${metric('活跃检测任务', String(activeTasks), '执行中/待复核', 'brand', 'flask-conical')}
    ${metric('待处理报告', String(pendingReports), '待审核/签发', 'warning', 'file-text')}
    ${metric('本月已完成', '12', '较上月+20%', 'positive', 'check-circle')}
    ${metric('质量风险', '1', '需关注', 'danger', 'alert-triangle')}
    ${metric('资源预警', '0', '全部有效', 'positive', 'settings-2')}
  `;

  const flowOverview = FlowCatalog.map((flow) => {
    return `<div class="panel compact" style="margin-bottom:12px;">
      <div class="panel-title">${escapeHtml(flow.id)} ${escapeHtml(flow.title)}<small>${escapeHtml(flow.responsibleRoles)}</small></div>
      <div class="link-chain">
        ${flow.primaryPath.map((pageId, i) => {
          const page = Pages[pageId];
          const label = page ? page.title : pageId;
          const arrow = i < flow.primaryPath.length - 1 ? '<span class="link-arrow">&rarr;</span>' : '';
          return `<span class="link-node" data-view="${pageId}">${escapeHtml(label)}</span>${arrow}`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  return heading('综合工作台', '集中查看业务、质量和资源指标，及时处理逾期任务与风险预警',
    ['工作台', '综合工作台'],
    button('刷新指标', 'refresh-metrics', 'secondary', 'refresh-cw')
  ) + `
    <div class="grid metrics" style="margin-bottom:16px;">${metricsHtml}</div>
    <div class="grid two">
      <div>
        ${panelWithActions('主流程导航', '', flowOverview)}
      </div>
      <div>
        ${panel('最近审计', timeline(data.auditLog.slice(0, 6)))}
        ${alert('info', '本页为候选仿真原型，所有数据均为虚构演示数据，非合规依据。点击上方流程节点可快速跳转。')}
      </div>
    </div>
  `;
}

// WB03 我的待办
export function renderWB03(ctx) {
  const data = getData();
  // 从业务数据生成待办
  const todos = [];
  data.commissions.forEach((c) => {
    if (c.status === '待评审') {
      todos.push({ id: `todo-cm-${c.id}`, title: `${c.code} 合同评审`, source: c.customerName, type: '评审', priority: '紧急', dueDate: c.expectedDate || '尽快', to: 'CC07' });
    }
    if (c.status === '草稿') {
      todos.push({ id: `todo-cm-${c.id}`, title: `${c.code} 委待提交评审`, source: c.customerName, type: '评审', priority: '普通', dueDate: c.expectedDate || '待定', to: 'CC04' });
    }
  });
  data.tasks.forEach((t) => {
    if (t.status === '待复核') {
      todos.push({ id: `todo-t-${t.id}`, title: `${t.code} 原始记录待复核`, source: t.testItems, type: '复核', priority: '紧急', dueDate: t.plannedDate || '尽快', to: 'TM12' });
    }
    if (t.status === '待开工') {
      todos.push({ id: `todo-t-${t.id}`, title: `${t.code} 任务待开工`, source: t.testItems, type: '审批', priority: '普通', dueDate: t.plannedDate || '待定', to: 'TM04' });
    }
  });
  data.reports.forEach((r) => {
    if (r.status === '待审核') {
      todos.push({ id: `todo-rp-${r.id}`, title: `${r.code} 报告待审核`, source: r.customerName, type: '审批', priority: '紧急', dueDate: r.deliveryDeadline || '尽快', to: 'RM04' });
    }
    if (r.status === '待签发') {
      todos.push({ id: `todo-rp-${r.id}`, title: `${r.code} 报告待签发`, source: r.customerName, type: '审批', priority: '紧急', dueDate: r.deliveryDeadline || '尽快', to: 'RM05' });
    }
  });

  const todoList = todos.length > 0
    ? `<div class="todo-list">${todos.map((t) => todoItem(t)).join('')}</div>`
    : emptyState('暂无待办事项');

  return heading('我的待办', `当前角色：${getSession().role} · 共 ${todos.length} 项待办`,
    ['工作台', '我的待办']
  ) + `
    <div class="grid two">
      ${panel('待办列表', todoList)}
      ${panel('待办统计', `
        <div class="kv-list">
          <div class="kv-item"><span class="kv-label">紧急</span><span class="kv-value">${todos.filter((t) => t.priority === '紧急').length}</span></div>
          <div class="kv-item"><span class="kv-label">普通</span><span class="kv-value">${todos.filter((t) => t.priority === '普通').length}</span></div>
          <div class="kv-item"><span class="kv-label">评审类</span><span class="kv-value">${todos.filter((t) => t.type === '评审').length}</span></div>
          <div class="kv-item"><span class="kv-label">审批类</span><span class="kv-value">${todos.filter((t) => t.type === '审批').length}</span></div>
        </div>
      `)}
    </div>
  `;
}

// AUDIT 审计轨迹
export function renderAudit(ctx) {
  const data = getData();
  return heading('审计轨迹', '查看本地操作审计记录，演示原型仅保留最近100条',
    ['审计', '审计轨迹'],
    button('重置演示数据', 'reset-data', 'warning', 'rotate-ccw')
  ) + panel('操作记录', timeline(data.auditLog));
}
