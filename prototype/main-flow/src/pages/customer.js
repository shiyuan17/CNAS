// 客户与委托模块页面渲染（CC01-CC09）
// 批次2 完整实现：客户台账/档案、委托列表/新建向导/详情/报价合同/合同评审/变更评审/客户沟通
// 交互机制：data-action/data-row-action/data-view 声明式 -> app.js 事件委托 -> cnas:action/cnas:row-action 自定义事件分发

import { Pages } from '../config/pages.js';
import { ObjectTypes, Schemas } from '../data/schema.js';
import { list, get, create, update, changeStatus, getCommissionChain } from '../data/repository.js';
import { execute, availableActions } from '../flow/state-machine.js';
import { getSession, getData, updateSession } from '../state/store.js';
import { findFlowByPage, getStepIndex } from '../flow/flow-catalog.js';
import {
  $, icon, escapeHtml, refreshIcons, button, status, heading, panel, panelWithActions,
  metric, timeline, steps, table, filterBar, kvList, alert, linkChain, emptyState,
} from '../ui/components.js';
import { toast, openModal, openForm, openDrawer, closeDrawer } from '../ui/overlay.js';
import { go } from '../ui/router.js';

// 当前页面选中的业务对象 ID（从 session 上下文获取）
function getContextId() {
  return getSession().currentContextId || null;
}

// ===== 主分发器 =====
export function renderCustomerPage(ctx) {
  const page = Pages[ctx.currentView];
  if (!page) return emptyState('页面未定义');

  const renderers = {
    CC01: renderCC01, CC02: renderCC02, CC03: renderCC03, CC04: renderCC04,
    CC05: renderCC05, CC06: renderCC06, CC07: renderCC07, CC08: renderCC08, CC09: renderCC09,
  };
  const fn = renderers[ctx.currentView];
  return fn ? fn(page, ctx) : emptyState(`${ctx.currentView} 渲染器未注册`);
}

// ========== CC01 客户台账（列表） ==========
function renderCC01(page, ctx) {
  const customers = list(ObjectTypes.CUSTOMER);
  const rows = customers.map((c) => ({
    ...c,
    status: c.cooperationStatus,
  }));

  const headerActions = button('新建客户', 'cc01-new-customer', 'primary', 'user-plus');

  return heading(page.title, page.subtitle, [page.module, page.title], headerActions)
    + filterBar('搜索客户名称或编号...', Schemas[ObjectTypes.CUSTOMER].fields.find((f) => f.key === 'cooperationStatus').enum)
    + panelWithActions('客户列表', '',
      table(
        [
          { label: '客户编号', key: 'code' },
          { label: '客户名称', key: 'name' },
          { label: '类型', key: 'type' },
          { label: '联系人', key: 'contact' },
          { label: '联系方式', key: 'phone' },
          { label: '信用状态', key: 'creditStatus' },
          { label: '保密等级', key: 'confidentiality' },
          { label: '合作状态', key: 'status' },
          { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
            <button class="button link secondary" data-view="CC02" data-context-id="${escapeHtml(row.id)}">查看</button>
            <button class="button link" data-action="cc01-edit" data-context-id="${escapeHtml(row.id)}">编辑</button>
          </div>` },
        ],
        rows,
      ),
    );
}

// ========== CC02 客户档案（详情） ==========
function renderCC02(page, ctx) {
  const id = ctx.contextId || getContextId();
  const customer = id ? get(ObjectTypes.CUSTOMER, id) : null;

  if (!customer) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从客户台账选择一个客户查看档案', 'user-x');
  }

  const commissions = list(ObjectTypes.COMMISSION, (c) => c.customerId === customer.id);
  const fields = Schemas[ObjectTypes.CUSTOMER].fields;
  const detail = kvList(fields, customer);

  const flowInfo = getStepIndex('CC02');
  const stepsHtml = flowInfo.flow ? steps(flowInfo.flow.primaryPath.map((p) => Pages[p]?.title || p), flowInfo.index) : '';

  const actions = `
    ${button('编辑信息', 'cc02-edit', 'primary', 'pencil')}
    ${customer.cooperationStatus === '活跃' ? button('暂停合作', 'cc02-suspend', 'warning', 'pause') : ''}
    ${customer.cooperationStatus === '暂停' ? button('恢复合作', 'cc02-activate', 'primary', 'play') : ''}
    ${button('新建委托', 'cc02-new-commission', 'secondary', 'file-plus')}
  `;

  return heading(page.title, page.subtitle, [page.module, '客户台账', customer.name], actions)
    + (stepsHtml ? panel('P01 流程位置', stepsHtml) : '')
    + `<div class="grid two">
      ${panel('基本信息', detail)}
      ${panel('委托历史', commissions.length > 0
        ? table(
          [{ label: '委托编号', key: 'code' }, { label: '类型', key: 'type' }, { label: '状态', key: 'status' }, { label: '操作', key: 'actions', render: (r) => `<button class="button link" data-view="CC05" data-context-id="${escapeHtml(r.id)}">查看</button>` }],
          commissions,
        )
        : emptyState('暂无委托记录'),
      )}
    </div>`;
}

// ========== CC03 委托列表 ==========
function renderCC03(page, ctx) {
  const commissions = list(ObjectTypes.COMMISSION);
  const rows = commissions.map((c) => ({ ...c }));

  const headerActions = button('新建委托', 'cc03-new-commission', 'primary', 'file-plus');

  return heading(page.title, page.subtitle, [page.module, page.title], headerActions)
    + filterBar('搜索委托编号或客户...', Schemas[ObjectTypes.COMMISSION].fields.find((f) => f.key === 'reviewConclusion').enum)
    + panelWithActions('委托列表', '',
      table(
        [
          { label: '委托编号', key: 'code' },
          { label: '客户名称', key: 'customerName' },
          { label: '类型', key: 'type' },
          { label: '样品数量', key: 'sampleCount' },
          { label: '期望日期', key: 'expectedDate' },
          { label: '评审进度', key: 'reviewProgress' },
          { label: '责任人', key: 'owner' },
          { label: '委托状态', key: 'status' },
          { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
            <button class="button link secondary" data-view="CC05" data-context-id="${escapeHtml(row.id)}">详情</button>
            ${row.status === '草稿' ? `<button class="button link" data-action="cc03-submit-review" data-context-id="${escapeHtml(row.id)}">提交评审</button>` : ''}
            ${(row.status === '待评审') ? `<button class="button link" data-view="CC07" data-context-id="${escapeHtml(row.id)}">评审</button>` : ''}
          </div>` },
        ],
        rows,
      ),
    );
}

// ========== CC04 新建委托向导 ==========
function renderCC04(page, ctx) {
  const customers = list(ObjectTypes.CUSTOMER, (c) => c.cooperationStatus === '活跃');
  const customerOpts = customers.map((c) => `<option value="${escapeHtml(c.id)}|${escapeHtml(c.name)}">${escapeHtml(c.code)} ${escapeHtml(c.name)}</option>`).join('');

  const stepNames = ['客户信息', '委托要求', '样品概况', '检测项目', '方法与交付'];
  const stepsHtml = steps(stepNames, 1);

  return heading(page.title, page.subtitle, [page.module, page.title])
    + stepsHtml
    + panel('第一步：客户信息', `
      <div class="form-field">
        <label>选择客户 <span class="required">*</span></label>
        <select data-wizard-field="customer">
          <option value="">请选择客户</option>
          ${customerOpts}
        </select>
      </div>
      <div class="form-field">
        <label>委托类型 <span class="required">*</span></label>
        <select data-wizard-field="type">
          <option value="">请选择</option>
          <option value="检测">检测</option>
          <option value="校准">校准</option>
        </select>
      </div>
      <div class="form-field">
        <label>期望完成日期</label>
        <input type="date" data-wizard-field="expectedDate" />
      </div>
      <div class="form-field">
        <label>委托要求</label>
        <textarea data-wizard-field="requirements" placeholder="检测项目、方法要求、判定规则、交付要求、特殊约定等"></textarea>
      </div>
      <div class="form-field">
        <label>样品数量</label>
        <input type="text" data-wizard-field="sampleCount" placeholder="如：3瓶×500ml" />
      </div>
    `)
    + alert('info', '后续步骤将在提交后通过编辑补充。本向导先创建草稿委托，再进入合同评审流程。')
    + `<div class="form-actions">${button('创建草稿委托', 'cc04-create', 'primary', 'save')} ${button('取消', 'cc04-cancel', 'secondary')}</div>`;
}

// ========== CC05 委托详情 ==========
function renderCC05(page, ctx) {
  const id = ctx.contextId || getContextId();
  const commission = id ? get(ObjectTypes.COMMISSION, id) : null;

  if (!commission) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从委托列表选择一个委托查看详情', 'file-x');
  }

  const fields = Schemas[ObjectTypes.COMMISSION].fields;
  const detail = kvList(fields, commission);
  const chain = getCommissionChain(commission.code);
  // 计算变更影响：是否存在已发布/已签发报告（FR-CONTRACT-005 阻断）
  const hasPublishedReport = chain.reports.some((r) => ['已发布', '已签发', '已归档', '已更正'].includes(r.status));
  const actions = availableActions(ObjectTypes.COMMISSION, commission, { impact: { hasPublishedReport } });
  const flowInfo = getStepIndex('CC05');
  const stepsHtml = flowInfo.flow ? steps(flowInfo.flow.primaryPath.map((p) => Pages[p]?.title || p), flowInfo.index) : '';

  // 根据状态生成可用操作按钮
  const actionButtons = actions.map((a) => {
    const actionMap = {
      'submit-review': { label: '提交评审', icon: 'send', view: null },
      'approve': { label: '通过评审', icon: 'check-circle', view: 'CC07' },
      'conditional-approve': { label: '附条件受理', icon: 'check', view: 'CC07' },
      'reject': { label: '退回补充', icon: 'x-circle', view: 'CC07' },
      'confirm': { label: '客户确认生效', icon: 'check-check', view: null },
      'change': { label: '发起变更', icon: 'git-branch', view: 'CC08' },
      'revoke': { label: '撤销委托', icon: 'ban', view: null },
    };
    const meta = actionMap[a.action] || { label: a.label, icon: 'circle', view: null };
    if (meta.view) {
      return `<button class="button primary" data-view="${meta.view}" data-context-id="${escapeHtml(commission.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`;
    }
    return `<button class="button primary" data-action="cc05-execute" data-execute-action="${escapeHtml(a.action)}" data-context-id="${escapeHtml(commission.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`;
  }).join('');

  // 跨流程衔接按钮
  const handoffButton = commission.status === '已受理'
    ? button('进入样品接收', 'cc05-goto-sample', 'brand', 'package-check')
    : '';
  // 报价与合同入口：未受理前都需要在 CC06 登记报价/提交评审/客户确认
  const quoteButton = commission.status !== '已受理'
    ? button('报价与合同', 'cc05-goto-quote', 'primary', 'file-text')
    : '';

  return heading(page.title, page.subtitle, [page.module, '委托列表', commission.code], actionButtons + quoteButton + handoffButton)
    + (stepsHtml ? panel('P01 流程位置', stepsHtml) : '')
    + `<div class="grid two">
      ${panel('委托基本信息', detail)}
      ${panel('关联链路', `
        ${linkChain([
          { label: '委托', to: '' },
          { label: `样品(${chain.samples.length})`, to: '' },
          { label: `任务(${chain.tasks.length})`, to: '' },
          { label: `报告(${chain.reports.length})`, to: '' },
        ])}
        ${chain.samples.length > 0 ? table(
          [{ label: '样品编号', key: 'code' }, { label: '名称', key: 'name' }, { label: '状态', key: 'status' }],
          chain.samples,
        ) : emptyState('暂无关联样品')}
      `)}
    </div>`
    + (chain.tasks.length > 0 ? panel('关联检测任务', table(
      [{ label: '任务编号', key: 'code' }, { label: '检测项目', key: 'testItems' }, { label: '执行人', key: 'executor' }, { label: '状态', key: 'status' }],
      chain.tasks,
    )) : '')
    + (chain.reports.length > 0 ? panel('关联报告', table(
      [{ label: '报告编号', key: 'code' }, { label: '类型', key: 'type' }, { label: '状态', key: 'status' }],
      chain.reports,
    )) : '');
}

// ========== CC06 报价与合同 ==========
function renderCC06(page, ctx) {
  const id = ctx.contextId || getContextId();
  const commission = id ? get(ObjectTypes.COMMISSION, id) : null;

  if (!commission) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从委托详情进入报价与合同', 'file-x');
  }

  const hasContract = !!commission.contractVersion;
  const contractInfo = hasContract
    ? kvList([
        { key: 'quotationAmount', label: '报价金额' },
        { key: 'contractVersion', label: '合同版本' },
      ], commission)
    : '<div class="empty-state"><p>尚未登记报价与合同</p></div>';

  const actions = `
    ${button('编辑报价', 'cc06-edit-quote', 'primary', 'pencil')}
    ${commission.status === '草稿' ? button('提交合同评审', 'cc06-submit-review', 'brand', 'send') : ''}
    ${commission.status === '评审通过' ? button('客户确认生效', 'cc06-confirm', 'brand', 'check-check') : ''}
  `;

  return heading(page.title, page.subtitle, [page.module, '委托', commission.code], actions)
    + alert(hasContract ? 'info' : 'warning',
      hasContract
        ? `合同版本 ${escapeHtml(commission.contractVersion)}，报价 ${escapeHtml(commission.quotationAmount || '未填写')}。客户确认后委托状态将变为"已受理"。`
        : '请先登记报价和合同条款，再提交合同评审。',
    )
    + panel('报价与合同信息', contractInfo)
    + panel('合同条款（演示）', `
      <div class="kv-list">
        <div class="kv-item"><span class="kv-label">计费项目</span><span class="kv-value">检测费 / 采样费 / 报告费</span></div>
        <div class="kv-item"><span class="kv-label">付款条件</span><span class="kv-value">报告交付后30天内付款</span></div>
        <div class="kv-item"><span class="kv-label">有效期</span><span class="kv-value">合同签订后90天</span></div>
        <div class="kv-item"><span class="kv-label">客户确认</span><span class="kv-value">${commission.status === '已受理' ? '已确认' : '待确认'}</span></div>
      </div>
    `);
}

// ========== CC07 合同评审 ==========
function renderCC07(page, ctx) {
  const id = ctx.contextId || getContextId();
  const commission = id ? get(ObjectTypes.COMMISSION, id) : null;

  if (!commission) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从委托列表进入合同评审', 'file-x');
  }

  const checklist = [
    { item: '能力范围', status: '通过', note: '检测项目在认可能力范围内' },
    { item: '方法适用性', status: '通过', note: '方法标准现行有效' },
    { item: '人员授权', status: '通过', note: '执行人/复核人已授权' },
    { item: '设备资源', status: commission.status === '待评审' ? '待校验' : '通过', note: '设备在校准有效期内' },
    { item: '环境条件', status: '通过', note: '环境条件满足方法要求' },
    { item: '交付周期', status: '通过', note: `期望日期 ${escapeHtml(commission.expectedDate || '')}` },
  ];

  const checklistHtml = table(
    [
      { label: '评审项', key: 'item' },
      { label: '结论', key: 'status' },
      { label: '说明', key: 'note' },
    ],
    checklist,
  );

  const session = getSession();
  const canApprove = ['技术负责人', '质量负责人'].includes(session.role);
  const isPending = commission.status === '待评审';

  const reviewActions = isPending && canApprove
    ? `<div class="form-actions">
        ${button('通过受理', 'cc07-approve', 'primary', 'check-circle')}
        ${button('附条件受理', 'cc07-conditional', 'secondary', 'check')}
        ${button('退回补充', 'cc07-reject', 'warning', 'x-circle')}
      </div>`
    : isPending && !canApprove
      ? alert('warning', `当前角色"${session.role}"无权评审，要求角色：技术负责人/质量负责人`)
      : alert('info', `委托当前状态：${commission.status}，评审结论：${commission.reviewConclusion || '待评审'}`);

  return heading(page.title, page.subtitle, [page.module, '委托', commission.code])
    + alert('info', `委托编号 ${escapeHtml(commission.code)} · 客户 ${escapeHtml(commission.customerName)} · 类型 ${escapeHtml(commission.type)}`)
    + panel('评审清单', checklistHtml)
    + panel('评审结论', `
      <div class="kv-list">
        <div class="kv-item"><span class="kv-label">当前状态</span><span class="kv-value">${status(commission.status)}</span></div>
        <div class="kv-item"><span class="kv-label">评审结论</span><span class="kv-value">${escapeHtml(commission.reviewConclusion || '待评审')}</span></div>
        <div class="kv-item"><span class="kv-label">责任人</span><span class="kv-value">${escapeHtml(commission.owner || '')}</span></div>
      </div>
    `)
    + reviewActions;
}

// ========== CC08 委托变更评审 ==========
function renderCC08(page, ctx) {
  const id = ctx.contextId || getContextId();
  const commission = id ? get(ObjectTypes.COMMISSION, id) : null;

  if (!commission) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从委托详情发起变更', 'file-x');
  }

  const chain = getCommissionChain(commission.code);
  const hasPublishedReport = chain.reports.some((r) => r.status === '已发布' || r.status === '已归档');
  const impactItems = [
    { item: '影响样品', status: chain.samples.length > 0 ? '关注' : '无', note: `${chain.samples.length} 个关联样品` },
    { item: '影响任务', status: chain.tasks.length > 0 ? '关注' : '无', note: `${chain.tasks.length} 个关联任务` },
    { item: '影响报告', status: hasPublishedReport ? '阻断' : chain.reports.length > 0 ? '关注' : '无', note: hasPublishedReport ? '存在已发布报告，必须完成影响评价 [FR-CONTRACT-005]' : `${chain.reports.length} 个关联报告` },
  ];

  const session = getSession();
  const canChange = ['业务受理人员', '技术负责人'].includes(session.role);
  const actionableStatus = ['已受理', '评审通过'].includes(commission.status);

  const changeActions = actionableStatus && canChange && !hasPublishedReport
    ? `<div class="form-actions">
        ${button('确认变更生效', 'cc08-confirm-change', 'primary', 'check-check')}
        ${button('取消变更', 'cc08-cancel', 'secondary')}
      </div>`
    : hasPublishedReport
      ? alert('danger', '存在已发布报告，必须完成影响评价后才可生效 [FR-CONTRACT-005]')
      : !canChange
        ? alert('warning', `当前角色"${session.role}"无权发起变更`)
        : alert('info', `委托当前状态：${commission.status}，不允许变更`);

  return heading(page.title, page.subtitle, [page.module, '委托', commission.code])
    + panel('变更内容', `
      <div class="form-field">
        <label>变更内容描述</label>
        <textarea data-change-field="description" placeholder="描述变更的具体内容、原因和影响范围"></textarea>
      </div>
      <div class="form-field">
        <label>变更来源</label>
        <select data-change-field="source">
          <option value="">请选择</option>
          <option value="客户要求">客户要求</option>
          <option value="内部发现">内部发现</option>
          <option value="沟通反馈">沟通反馈</option>
        </select>
      </div>
    `)
    + panel('影响评价', table(
      [{ label: '影响项', key: 'item' }, { label: '级别', key: 'status' }, { label: '说明', key: 'note' }],
      impactItems,
    ))
    + changeActions;
}

// ========== CC09 客户沟通与满意度 ==========
function renderCC09(page, ctx) {
  // 演示数据：从审计日志中提取沟通记录（简化实现）
  const data = getData();
  const communications = [
    { id: 'comm-1', customer: '清源环境科技有限公司', type: '电话沟通', commission: 'COMM-2026-0001', channel: '电话', content: '确认检测项目和时间安排', owner: '张晨', result: '已确认', status: '已完成' },
    { id: 'comm-2', customer: '市疾控中心卫生检验所', type: '需求确认', commission: 'COMM-2026-0002', channel: '邮件', content: '食品接触材料迁移量检测项目明细', owner: '张晨', result: '待回复', status: '进行中' },
    { id: 'comm-3', customer: '恒达精密仪器制造厂', type: '报价咨询', commission: 'COMM-2026-0003', channel: '现场', content: '校准费用和交付周期咨询', owner: '张晨', result: '已报价', status: '已完成' },
  ];

  return heading(page.title, page.subtitle, [page.module, page.title], button('记录沟通', 'cc09-new', 'primary', 'message-square-plus'))
    + filterBar('搜索客户或内容...', ['进行中', '已完成'])
    + panelWithActions('沟通记录', '',
      table(
        [
          { label: '客户', key: 'customer' },
          { label: '沟通类型', key: 'type' },
          { label: '关联委托', key: 'commission' },
          { label: '渠道', key: 'channel' },
          { label: '内容', key: 'content' },
          { label: '责任人', key: 'owner' },
          { label: '反馈结果', key: 'result' },
          { label: '状态', key: 'status' },
        ],
        communications,
      ),
    );
}

// ====================================================================
// 页面级动作处理（监听 cnas:action / cnas:row-action）
// app.js 的事件委托已统一提取 data-context-id 到 session.currentContextId
// ====================================================================

// 动作事件处理
document.addEventListener('cnas:action', (event) => {
  const { action, el } = event.detail;
  const contextId = el?.getAttribute('data-context-id') || getContextId();
  const session = getSession();

  switch (action) {
    // ===== CC01 客户 =====
    case 'cc01-new-customer':
      openCustomerForm(null);
      break;
    case 'cc01-edit':
      openCustomerForm(contextId);
      break;

    // ===== CC02 客户档案 =====
    case 'cc02-edit':
      openCustomerForm(contextId);
      break;
    case 'cc02-suspend':
      executeCustomerStatusChange(contextId, '暂停', '暂停合作');
      break;
    case 'cc02-activate':
      executeCustomerStatusChange(contextId, '活跃', '恢复合作');
      break;
    case 'cc02-new-commission':
      updateSession({ currentContextId: contextId });
      go('CC04');
      break;

    // ===== CC03 委托列表 =====
    case 'cc03-new-commission':
      go('CC04');
      break;
    case 'cc03-submit-review': {
      const item = get(ObjectTypes.COMMISSION, contextId);
      const result = execute(ObjectTypes.COMMISSION, 'submit-review', { objectId: contextId, role: session.role, item });
      handleExecuteResult(result, '委托已提交评审', 'CC03');
      break;
    }

    // ===== CC04 新建委托 =====
    case 'cc04-create': {
      const fields = {};
      document.querySelectorAll('[data-wizard-field]').forEach((f) => {
        fields[f.dataset.wizardField] = f.value.trim();
      });
      if (!fields.customer) { toast('请选择客户', '', 'warning'); return; }
      if (!fields.type) { toast('请选择委托类型', '', 'warning'); return; }
      const [customerId, customerName] = fields.customer.split('|');
      const created = create(ObjectTypes.COMMISSION, {
        customerId,
        customerName,
        type: fields.type,
        expectedDate: fields.expectedDate,
        requirements: fields.requirements,
        sampleCount: fields.sampleCount,
        owner: session.role,
        reviewProgress: '草稿',
        reviewConclusion: '待评审',
      });
      toast('委托已创建', `${created.code} 草稿已保存`, 'success');
      updateSession({ currentContextId: created.id });
      go('CC05');
      break;
    }
    case 'cc04-cancel':
      go('CC03');
      break;

    // ===== CC05 委托详情 =====
    case 'cc05-execute': {
      const executeAction = el?.getAttribute('data-execute-action');
      const item = get(ObjectTypes.COMMISSION, contextId);
      if (!item) return;

      // 需要确认的操作先弹窗
      if (executeAction === 'revoke') {
        openModal('撤销委托', `确定撤销委托 ${item.code} 吗？此操作不可逆。`, '确认撤销', () => {
          const result = execute(ObjectTypes.COMMISSION, 'revoke', { objectId: contextId, role: session.role, item });
          handleExecuteResult(result, '委托已撤销', 'CC03');
        }, true);
        return;
      }
      if (executeAction === 'confirm') {
        // 客户确认生效，需要合同版本
        if (!item.contractVersion) {
          toast('无法确认', '合同版本缺失，请先在报价与合同页面登记 [FR-CONTRACT-004]', 'warning');
          return;
        }
      }
      const result = execute(ObjectTypes.COMMISSION, executeAction, { objectId: contextId, role: session.role, item });
      handleExecuteResult(result, '操作成功', 'CC05');
      break;
    }
    case 'cc05-goto-sample':
      updateSession({ currentContextId: contextId });
      go('SM01');
      break;
    case 'cc05-goto-quote':
      updateSession({ currentContextId: contextId });
      go('CC06');
      break;

    // ===== CC06 报价与合同 =====
    case 'cc06-edit-quote':
      openQuoteForm(contextId);
      break;
    case 'cc06-submit-review': {
      const item = get(ObjectTypes.COMMISSION, contextId);
      const result = execute(ObjectTypes.COMMISSION, 'submit-review', { objectId: contextId, role: session.role, item });
      handleExecuteResult(result, '已提交合同评审', 'CC07');
      break;
    }
    case 'cc06-confirm': {
      const item = get(ObjectTypes.COMMISSION, contextId);
      const result = execute(ObjectTypes.COMMISSION, 'confirm', { objectId: contextId, role: session.role, item });
      handleExecuteResult(result, '委托已确认生效', 'CC05');
      break;
    }

    // ===== CC07 合同评审 =====
    case 'cc07-approve':
      executeReview(contextId, 'approve', session.role);
      break;
    case 'cc07-conditional':
      executeReview(contextId, 'conditional-approve', session.role);
      break;
    case 'cc07-reject':
      executeReview(contextId, 'reject', session.role);
      break;

    // ===== CC08 变更评审 =====
    case 'cc08-confirm-change': {
      const item = get(ObjectTypes.COMMISSION, contextId);
      // 计算变更影响：已发布报告阻断 [FR-CONTRACT-005]
      const chain = getCommissionChain(item.code);
      const hasPublishedReport = chain.reports.some((r) => ['已发布', '已签发', '已归档', '已更正'].includes(r.status));
      const result = execute(ObjectTypes.COMMISSION, 'change', { objectId: contextId, role: session.role, item, impact: { hasPublishedReport } });
      handleExecuteResult(result, '变更已生效', 'CC05');
      break;
    }
    case 'cc08-cancel':
      go('CC05');
      break;

    // ===== CC09 客户沟通 =====
    case 'cc09-new':
      toast('演示提示', '客户沟通记录功能为演示版，数据不会持久化', 'info');
      break;

    default:
      // 未识别的动作，忽略（可能属于其他模块）
      break;
  }
});

// ===== 辅助函数 =====

function handleExecuteResult(result, successMsg, redirectView) {
  if (result.ok) {
    toast(successMsg, result.warning || '', 'success');
    if (redirectView) go(redirectView);
  } else {
    if (result.permissionDenied) {
      toast('权限不足', result.reason, 'danger');
    } else {
      toast('操作被阻断', result.reason, 'warning');
    }
  }
}

function executeReview(commissionId, action, role) {
  const item = get(ObjectTypes.COMMISSION, commissionId);
  const result = execute(ObjectTypes.COMMISSION, action, { objectId: commissionId, role, item });
  if (result.ok) {
    // 更新评审结论字段
    const conclusionMap = { approve: '通过', 'conditional-approve': '附条件', reject: '退回' };
    update(ObjectTypes.COMMISSION, commissionId, {
      reviewConclusion: conclusionMap[action] || '待评审',
      reviewProgress: conclusionMap[action] || '待评审',
    });
    toast('评审完成', `评审结论：${conclusionMap[action]}`, 'success');
    // 评审通过 → 回 CC06 做客户确认生效；退回/附条件 → 回 CC05 详情
    go(action === 'approve' ? 'CC06' : 'CC05');
  } else {
    handleExecuteResult(result, '', null);
  }
}

function executeCustomerStatusChange(customerId, newStatus, label) {
  update(ObjectTypes.CUSTOMER, customerId, { cooperationStatus: newStatus });
  toast(label + '成功', `客户合作状态已变更为：${newStatus}`, 'success');
  go('CC02');
}

function openCustomerForm(customerId) {
  const customer = customerId ? get(ObjectTypes.CUSTOMER, customerId) : null;
  const fields = Schemas[ObjectTypes.CUSTOMER].fields.filter((f) => f.key !== 'code' && f.key !== 'cooperationStatus');
  const formFields = fields.map((f) => ({
    key: f.key,
    label: f.label,
    required: f.required,
    enum: f.enum,
    value: customer ? customer[f.key] : '',
    placeholder: f.hint || '',
  }));

  openForm(customerId ? '编辑客户信息' : '新建客户', '请填写客户基本信息，带 * 为必填项。', formFields, (values) => {
    // 校验必填
    for (const f of formFields) {
      if (f.required && !values[f.key]) {
        toast('校验失败', `${f.label}为必填项`, 'warning');
        return;
      }
    }
    if (customerId) {
      update(ObjectTypes.CUSTOMER, customerId, values);
      toast('已保存', '客户信息已更新', 'success');
    } else {
      const created = create(ObjectTypes.CUSTOMER, { ...values, cooperationStatus: '活跃' });
      toast('已创建', `${created.code} 客户已建档`, 'success');
    }
    go('CC01');
  }, { submitLabel: customerId ? '保存修改' : '创建客户' });
}

function openQuoteForm(commissionId) {
  const commission = get(ObjectTypes.COMMISSION, commissionId);
  if (!commission) return;
  const fields = [
    { key: 'quotationAmount', label: '报价金额', value: commission.quotationAmount || '', placeholder: '如：¥4,800' },
    { key: 'contractVersion', label: '合同版本', value: commission.contractVersion || '', placeholder: '如：V1' },
    { key: 'sampleCount', label: '样品数量', value: commission.sampleCount || '' },
    { key: 'expectedDate', label: '期望日期', value: commission.expectedDate || '' },
  ];
  openForm('编辑报价与合同', '登记报价金额和合同版本，客户确认后委托生效。', fields, (values) => {
    update(ObjectTypes.COMMISSION, commissionId, values);
    toast('已保存', '报价与合同信息已更新', 'success');
  }, { submitLabel: '保存' });
}
