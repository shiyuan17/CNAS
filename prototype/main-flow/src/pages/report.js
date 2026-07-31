// 报告编制、发布与归档模块页面渲染（RM01-RM11）
// 批次5 完整实现：队列/编制/预览检查/审核/授权签发/认可核验/发布/详情版本/更正/撤回作废/归档
// 包含 TM14->RM01 衔接和 RM07->SM11 闭环

import { Pages } from '../config/pages.js';
import { ObjectTypes, Schemas } from '../data/schema.js';
import { list, get, create, update, changeStatus } from '../data/repository.js';
import { execute, availableActions } from '../flow/state-machine.js';
import { getSession, getData, updateSession } from '../state/store.js';
import { findFlowByPage, getStepIndex } from '../flow/flow-catalog.js';
import {
  $, icon, escapeHtml, refreshIcons, button, status, heading, panel, panelWithActions,
  metric, timeline, steps, table, filterBar, kvList, alert, linkChain, emptyState,
} from '../ui/components.js';
import { toast, openModal, openForm, openDrawer, closeDrawer } from '../ui/overlay.js';
import { go } from '../ui/router.js';

function getContextId() {
  return getSession().currentContextId || null;
}

// ===== 主分发器 =====
export function renderReportPage(ctx) {
  const page = Pages[ctx.currentView];
  if (!page) return emptyState('页面未定义');

  const renderers = {
    RM01: renderRM01, RM02: renderRM02, RM03: renderRM03, RM04: renderRM04, RM05: renderRM05,
    RM06: renderRM06, RM07: renderRM07, RM08: renderRM08, RM09: renderRM09, RM10: renderRM10, RM11: renderRM11,
  };
  const fn = renderers[ctx.currentView];
  return fn ? fn(page, ctx) : emptyState(`${ctx.currentView} 渲染器未注册`);
}

// ========== RM01 报告队列 ==========
function renderRM01(page, ctx) {
  const reports = list(ObjectTypes.REPORT);

  return heading(page.title, page.subtitle, [page.module, page.title], button('新建报告', 'rm01-new', 'primary', 'file-plus'))
    + filterBar('搜索报告编号或客户...', ['草稿', '待审核', '审核退回', '待签发', '签发退回', '已签发', '发布失败', '已发布', '已召回', '已更正', '已归档'])
    + panelWithActions('报告队列', '',
      table(
        [
          { label: '报告编号', key: 'code' },
          { label: '委托编号', key: 'commissionCode' },
          { label: '客户名称', key: 'customerName' },
          { label: '类型', key: 'type' },
          { label: '编制人', key: 'author' },
          { label: '审核人', key: 'reviewer' },
          { label: '签发人', key: 'signer' },
          { label: '状态', key: 'status' },
          { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
            <button class="button link secondary" data-view="RM08" data-context-id="${escapeHtml(row.id)}">详情</button>
            ${['草稿', '审核退回'].includes(row.status) ? `<button class="button link" data-view="RM02" data-context-id="${escapeHtml(row.id)}">编制</button>` : ''}
            ${row.status === '待审核' ? `<button class="button link" data-view="RM04" data-context-id="${escapeHtml(row.id)}">审核</button>` : ''}
            ${row.status === '待签发' ? `<button class="button link" data-view="RM05" data-context-id="${escapeHtml(row.id)}">签发</button>` : ''}
            ${row.status === '已签发' ? `<button class="button link" data-view="RM07" data-context-id="${escapeHtml(row.id)}">发布</button>` : ''}
          </div>` },
        ],
        reports,
      ),
    );
}

// ========== RM02 报告编制 ==========
function renderRM02(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从报告队列选择报告进行编制', 'file-x');
  }

  const session = getSession();
  const canEdit = ['草稿', '审核退回'].includes(report.status);
  const canSubmit = canEdit && ['检测员', '业务受理人员'].includes(session.role);

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + panel('报告信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'commissionCode', label: '委托编号' }, { key: 'customerName', label: '客户名称' }, { key: 'type', label: '报告类型' }, { key: 'status', label: '当前状态' }],
      report,
    ))
    + panel('编制内容', `
      <div class="form-field">
        <label>编制人</label>
        <input type="text" data-edit-field="author" value="${escapeHtml(report.author || '')}" />
      </div>
      <div class="form-field">
        <label>报告类型</label>
        <select data-edit-field="type">
          <option value="检测报告" ${report.type === '检测报告' ? 'selected' : ''}>检测报告</option>
          <option value="校准证书" ${report.type === '校准证书' ? 'selected' : ''}>校准证书</option>
        </select>
      </div>
      <div class="form-field">
        <label>认可标识</label>
        <select data-edit-field="accreditationScope">
          <option value="认可" ${report.accreditationScope === '认可' ? 'selected' : ''}>认可</option>
          <option value="非认可" ${report.accreditationScope === '非认可' ? 'selected' : ''}>非认可</option>
          <option value="分包" ${report.accreditationScope === '分包' ? 'selected' : ''}>分包</option>
        </select>
      </div>
      <div class="form-field">
        <label>报告内容（摘要）</label>
        <textarea data-edit-field="content" placeholder="报告结论、检测项目结果汇总、判定依据等"></textarea>
      </div>
    `)
    + (canEdit
      ? `<div class="form-actions">
          ${button('保存', 'rm02-save', 'secondary', 'save')}
          ${canSubmit ? button('提交审核', 'rm02-submit', 'primary', 'send') : ''}
          ${button('预览检查', 'rm02-preview', 'secondary', 'eye')}
        </div>`
      : alert('info', `报告当前状态：${report.status}，仅"草稿/审核退回"状态可编制`));
}

// ========== RM03 预览检查 ==========
function renderRM03(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择报告进行预览检查', 'eye');
  }

  const checks = [
    { item: '页面完整性', status: '通过', note: '无缺页' },
    { item: '数据一致性', status: '通过', note: '报告数据与原始记录一致' },
    { item: '格式规范', status: '通过', note: '符合报告模板要求' },
    { item: '附件检查', status: '通过', note: '附件齐全' },
    { item: '签字完整性', status: report.author ? '通过' : '阻断', note: report.author ? '编制人已填写' : '编制人缺失' },
  ];

  const allPass = checks.every((c) => c.status === '通过');

  return heading(page.title, page.subtitle, [page.module, '报告', report.code],
    allPass ? button('通过检查', 'rm03-pass', 'primary', 'check-circle') : '')
    + panel('检查结果', table(
      [{ label: '检查项', key: 'item' }, { label: '结论', key: 'status' }, { label: '说明', key: 'note' }],
      checks,
    ))
    + (allPass
      ? alert('info', '完整性检查通过，可提交审核')
      : alert('danger', '存在阻断项，请修正后再提交 [FR-REPORT-001]'));
}

// ========== RM04 报告审核 ==========
function renderRM04(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择待审核报告', 'clipboard-check');
  }

  const session = getSession();
  const canReview = ['复核人', '质量负责人'].includes(session.role);
  const isPending = report.status === '待审核';

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + panel('报告信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'type', label: '报告类型' }, { key: 'author', label: '编制人' }, { key: 'status', label: '当前状态' }],
      report,
    ))
    + panel('审核登记', `
      <div class="form-field">
        <label>审核人</label>
        <input type="text" data-review-field="reviewer" value="${escapeHtml(report.reviewer || session.role)}" />
      </div>
      <div class="form-field">
        <label>审核意见</label>
        <textarea data-review-field="opinion" placeholder="审核意见"></textarea>
      </div>
    `)
    + (isPending && canReview
      ? `<div class="form-actions">
          ${button('审核通过', 'rm04-pass', 'primary', 'check-circle')}
          ${button('审核退回', 'rm04-return', 'warning', 'x-circle')}
        </div>`
      : isPending && !canReview
        ? alert('warning', `当前角色"${session.role}"无权审核，要求角色：复核人或质量负责人（演示环境无独立复核人角色，请切换为质量负责人）`)
        : alert('info', `报告当前状态：${report.status}`));
}

// ========== RM05 授权签发 ==========
function renderRM05(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择待签发报告', 'pen-tool');
  }

  const session = getSession();
  const canSign = session.role === '授权签字人';
  const isPending = report.status === '待签发';

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + alert('info', '电子签名绑定签名人/目的/版本/摘要/时间 [TBD-010 待确认签名方式]')
    + panel('报告信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'type', label: '报告类型' }, { key: 'author', label: '编制人' }, { key: 'reviewer', label: '审核人' }, { key: 'status', label: '当前状态' }],
      report,
    ))
    + panel('签发登记', `
      <div class="form-field">
        <label>授权签字人 <span class="required">*</span></label>
        <input type="text" data-sign-field="signer" value="${escapeHtml(report.signer || '')}" placeholder="授权签字人姓名" />
      </div>
      <div class="form-field">
        <label>授权范围</label>
        <select data-sign-field="scope">
          <option value="认可范围内">认可范围内</option>
          <option value="超范围">超范围（需特别批准）</option>
        </select>
      </div>
      <div class="form-field">
        <label>签名方式</label>
        <select data-sign-field="method">
          <option value="电子签名">电子签名</option>
          <option value="手写签名扫描">手写签名扫描</option>
        </select>
      </div>
    `)
    + (isPending && canSign
      ? `<div class="form-actions">
          ${button('授权签发', 'rm05-sign', 'primary', 'check-check')}
          ${button('签发退回', 'rm05-return', 'warning', 'x-circle')}
        </div>`
      : isPending && !canSign
        ? alert('warning', `当前角色"${session.role}"无权签发，要求角色：授权签字人 [RULE-010]`)
        : alert('info', `报告当前状态：${report.status}`));
}

// ========== RM06 认可标识核验 ==========
function renderRM06(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择报告进行认可标识核验', 'badge-check');
  }

  const session = getSession();
  const canVerify = ['授权签字人', '质量负责人'].includes(session.role);
  const inScope = report.accreditationScope === '认可';

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + panel('认可标识信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'accreditationScope', label: '认可标识' }, { key: 'type', label: '报告类型' }],
      report,
    ))
    + panel('核验结果', `
      <div class="kv-list">
        <div class="kv-item"><span class="kv-label">认可标识</span><span class="kv-value">${escapeHtml(report.accreditationScope || '未设置')}</span></div>
        <div class="kv-item"><span class="kv-label">认可范围</span><span class="kv-value">${inScope ? '在认可范围内' : '超范围或非认可'}</span></div>
        <div class="kv-item"><span class="kv-label">超范围项</span><span class="kv-value">${inScope ? '无' : '存在超范围项目'}</span></div>
      </div>
    `)
    + (inScope
      ? alert('success', '认可标识使用正确，报告在认可能力范围内 [FR-REPORT-002]')
      : alert('danger', '报告含超范围项目，不得误用认可标识 [FR-REPORT-002]'))
    + (canVerify && report.status === '已签发'
      ? `<div class="form-actions">${button('确认核验通过', 'rm06-verify', 'primary', 'check-circle')}</div>`
      : '');
}

// ========== RM07 报告发布 ==========
function renderRM07(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择已签发报告进行发布', 'send');
  }

  const session = getSession();
  const canPublish = ['授权签字人', '业务受理人员'].includes(session.role);
  const canDoStatus = ['已签发', '发布失败'].includes(report.status);

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + panel('报告信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'customerName', label: '客户名称' }, { key: 'signer', label: '签发人' }, { key: 'status', label: '当前状态' }, { key: 'deliveryChannel', label: '交付渠道' }],
      report,
    ))
    + panel('发布登记', `
      <div class="form-field">
        <label>交付渠道</label>
        <select data-publish-field="channel">
          <option value="邮件" ${report.deliveryChannel === '邮件' ? 'selected' : ''}>邮件</option>
          <option value="快递" ${report.deliveryChannel === '快递' ? 'selected' : ''}>快递</option>
          <option value="自取" ${report.deliveryChannel === '自取' ? 'selected' : ''}>自取</option>
          <option value="平台下载" ${report.deliveryChannel === '平台下载' ? 'selected' : ''}>平台下载</option>
        </select>
      </div>
      <div class="form-field">
        <label>接收人/地址</label>
        <input type="text" data-publish-field="recipient" placeholder="客户邮箱或地址" />
      </div>
    `)
    + (canDoStatus && canPublish
      ? `<div class="form-actions">
          ${button('确认发布', 'rm07-publish', 'primary', 'send')}
          ${button('发布失败', 'rm07-fail', 'warning', 'x-circle')}
        </div>`
      : !canDoStatus
        ? alert('info', `报告当前状态：${report.status}，仅"已签发/发布失败"状态可发布`)
        : alert('warning', `当前角色"${session.role}"无权发布`));
}

// ========== RM08 报告详情与版本 ==========
function renderRM08(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从报告队列选择报告查看详情', 'file-x');
  }

  const fields = Schemas[ObjectTypes.REPORT].fields;
  const detail = kvList(fields, report);
  const actions = availableActions(ObjectTypes.REPORT, report);
  const flowInfo = getStepIndex('RM08');
  const stepsHtml = flowInfo.flow ? steps(flowInfo.flow.primaryPath.map((p) => Pages[p]?.title || p), flowInfo.index) : '';

  const actionButtons = actions.map((a) => {
    const actionMap = {
      'submit-review': { label: '提交审核', icon: 'send', view: 'RM02' },
      'review-pass': { label: '审核通过', icon: 'check-circle', view: 'RM04' },
      'review-return': { label: '审核退回', icon: 'x-circle', view: 'RM04' },
      'sign': { label: '授权签发', icon: 'pen-tool', view: 'RM05' },
      'sign-return': { label: '签发退回', icon: 'x-circle', view: 'RM05' },
      'publish': { label: '发布', icon: 'send', view: 'RM07' },
      'publish-fail': { label: '发布失败', icon: 'x-circle', view: 'RM07' },
      'retry-publish': { label: '重试发布', icon: 'rotate-ccw', view: 'RM07' },
      'correct': { label: '发起更正', icon: 'edit', view: 'RM09' },
      'withdraw': { label: '撤回/作废', icon: 'ban', view: 'RM10' },
      'archive': { label: '归档', icon: 'archive', view: 'RM11' },
    };
    const meta = actionMap[a.action] || { label: a.label, icon: 'circle', view: null };
    if (meta.view) {
      return `<button class="button primary" data-view="${meta.view}" data-context-id="${escapeHtml(report.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`;
    }
    return '';
  }).join('');

  // 生命周期时间线
  const lifecycleItems = [];
  if (report.author) lifecycleItems.push({ time: report.createdAt || '', title: '报告编制', detail: `编制人：${report.author}` });
  if (['待审核', '待签发', '已签发', '已发布', '已归档', '已更正'].includes(report.status)) lifecycleItems.push({ time: '', title: '提交审核', detail: '已提交审核' });
  if (['待签发', '已签发', '已发布', '已归档'].includes(report.status)) lifecycleItems.push({ time: '', title: '审核通过', detail: `审核人：${report.reviewer || ''}` });
  if (['已签发', '已发布', '已归档'].includes(report.status)) lifecycleItems.push({ time: '', title: '授权签发', detail: `签发人：${report.signer || ''}` });
  if (['已发布', '已归档', '已更正', '已召回'].includes(report.status)) lifecycleItems.push({ time: '', title: '报告发布', detail: `渠道：${report.deliveryChannel || ''}` });
  if (['已归档'].includes(report.status)) lifecycleItems.push({ time: '', title: '归档', detail: '已归档' });
  if (report.status === '已更正') lifecycleItems.push({ time: '', title: '更正', detail: '已发起更正，生成新版本' });
  if (report.status === '已召回') lifecycleItems.push({ time: '', title: '撤回/作废', detail: '已撤回，停止有效交付' });

  // 跨流程闭环按钮
  const handoffButton = report.status === '已发布'
    ? button('进入留样管理', 'rm08-goto-retention', 'brand', 'archive')
    : '';

  return heading(page.title, page.subtitle, [page.module, '报告队列', report.code], actionButtons + handoffButton)
    + (stepsHtml ? panel('P04 流程位置', stepsHtml) : '')
    + `<div class="grid two">
      ${panel('报告信息', detail)}
      ${panel('生命周期', timeline(lifecycleItems))}
    </div>`;
}

// ========== RM09 报告更正 ==========
function renderRM09(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从报告详情发起更正', 'edit');
  }

  const session = getSession();
  const canCorrect = ['授权签字人', '质量负责人'].includes(session.role);
  const canDoStatus = report.status === '已发布';

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + alert('warning', '更正生成新版本并重新履行审核与签发；原版不得删除 [FR-REPORT-006]')
    + panel('原报告信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'version', label: '当前版本' }, { key: 'status', label: '当前状态' }],
      report,
    ))
    + panel('更正登记', `
      <div class="form-field">
        <label>更正原因 <span class="required">*</span></label>
        <textarea data-correct-field="reason" placeholder="说明更正原因"></textarea>
      </div>
      <div class="form-field">
        <label>更正内容</label>
        <textarea data-correct-field="content" placeholder="说明更正的具体内容"></textarea>
      </div>
      <div class="form-field">
        <label>影响评价</label>
        <select data-correct-field="impact">
          <option value="无影响">无影响</option>
          <option value="结果变更">结果变更</option>
          <option value="结论变更">结论变更</option>
        </select>
      </div>
    `)
    + (canDoStatus && canCorrect
      ? `<div class="form-actions">${button('确认更正', 'rm09-correct', 'primary', 'edit')}</div>`
      : !canDoStatus
        ? alert('info', `报告当前状态：${report.status}，仅"已发布"状态可发起更正`)
        : alert('warning', `当前角色"${session.role}"无权更正，要求角色：授权签字人/质量负责人`));
}

// ========== RM10 报告撤回/作废 ==========
function renderRM10(page, ctx) {
  const id = ctx.contextId || getContextId();
  const report = id ? get(ObjectTypes.REPORT, id) : null;

  if (!report) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从报告详情发起撤回', 'ban');
  }

  const session = getSession();
  const canWithdraw = ['授权签字人', '质量负责人'].includes(session.role);
  const canDoStatus = report.status === '已发布';

  return heading(page.title, page.subtitle, [page.module, '报告', report.code])
    + alert('danger', '撤回停止有效交付，原版转已召回；不得删除原报告 [FR-REPORT-006]')
    + panel('报告信息', kvList(
      [{ key: 'code', label: '报告编号' }, { key: 'customerName', label: '客户名称' }, { key: 'version', label: '版本' }, { key: 'status', label: '当前状态' }],
      report,
    ))
    + panel('撤回登记', `
      <div class="form-field">
        <label>撤回原因 <span class="required">*</span></label>
        <textarea data-withdraw-field="reason" placeholder="说明撤回原因"></textarea>
      </div>
      <div class="form-field">
        <label>影响范围</label>
        <select data-withdraw-field="impact">
          <option value="客户已收到">客户已收到（需通知）</option>
          <option value="客户未收到">客户未收到</option>
          <option value="部分交付">部分交付</option>
        </select>
      </div>
      <div class="form-field">
        <label>通知客户</label>
        <select data-withdraw-field="notify">
          <option value="是">是 - 立即通知客户</option>
          <option value="否">否</option>
        </select>
      </div>
    `)
    + (canDoStatus && canWithdraw
      ? `<div class="form-actions">${button('确认撤回', 'rm10-withdraw', 'danger', 'ban')}</div>`
      : !canDoStatus
        ? alert('info', `报告当前状态：${report.status}，仅"已发布"状态可撤回`)
        : alert('warning', `当前角色"${session.role}"无权撤回`));
}

// ========== RM11 报告归档 ==========
function renderRM11(page, ctx) {
  const archived = list(ObjectTypes.REPORT, (r) => ['已发布', '已更正', '已归档'].includes(r.status));

  return heading(page.title, page.subtitle, [page.module, page.title])
    + filterBar('搜索报告编号...', ['已发布', '已更正', '已归档'])
    + (archived.length > 0
      ? panelWithActions('归档列表', '',
        table(
          [
            { label: '报告编号', key: 'code' },
            { label: '客户名称', key: 'customerName' },
            { label: '版本', key: 'version' },
            { label: '状态', key: 'status' },
            { label: '交付渠道', key: 'deliveryChannel' },
            { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
              <button class="button link secondary" data-view="RM08" data-context-id="${escapeHtml(row.id)}">详情</button>
              ${row.status === '已发布' ? `<button class="button link" data-action="rm11-archive" data-context-id="${escapeHtml(row.id)}">归档</button>` : ''}
              ${row.status === '已发布' ? `<button class="button link" data-view="RM09" data-context-id="${escapeHtml(row.id)}">更正</button>` : ''}
              ${row.status === '已发布' ? `<button class="button link" data-view="RM10" data-context-id="${escapeHtml(row.id)}">撤回</button>` : ''}
            </div>` },
          ],
          archived,
        ),
      )
      : panel('归档列表', emptyState('暂无可归档报告', 'archive')));
}

// ====================================================================
// 页面级动作处理
// ====================================================================
document.addEventListener('cnas:action', (event) => {
  const { action, el } = event.detail;
  const contextId = el?.getAttribute('data-context-id') || getContextId();
  const session = getSession();

  switch (action) {
    // ===== RM01 =====
    case 'rm01-new':
      toast('演示提示', '请从委托详情创建报告，或选择已有报告编制', 'info');
      break;

    // ===== RM02 编制 =====
    case 'rm02-save': {
      const fields = {};
      document.querySelectorAll('[data-edit-field]').forEach((f) => { fields[f.dataset.editField] = f.value.trim(); });
      update(ObjectTypes.REPORT, contextId, fields);
      toast('已保存', '报告内容已更新', 'success');
      break;
    }
    case 'rm02-submit': {
      const item = get(ObjectTypes.REPORT, contextId);
      // 先保存表单
      const fields = {};
      document.querySelectorAll('[data-edit-field]').forEach((f) => { fields[f.dataset.editField] = f.value.trim(); });
      if (fields.author) update(ObjectTypes.REPORT, contextId, { author: fields.author });
      if (fields.type) update(ObjectTypes.REPORT, contextId, { type: fields.type });
      const result = execute(ObjectTypes.REPORT, 'submit-review', { objectId: contextId, role: session.role, item: get(ObjectTypes.REPORT, contextId) });
      handleResult(result, '已提交审核', 'RM01');
      break;
    }
    case 'rm02-preview':
      updateSession({ currentContextId: contextId });
      go('RM03');
      break;

    // ===== RM03 预览检查 =====
    case 'rm03-pass':
      toast('检查通过', '可提交审核', 'success');
      go('RM02');
      break;

    // ===== RM04 审核 =====
    case 'rm04-pass': {
      const item = get(ObjectTypes.REPORT, contextId);
      const reviewer = document.querySelector('[data-review-field="reviewer"]')?.value.trim();
      if (reviewer) update(ObjectTypes.REPORT, contextId, { reviewer });
      const result = execute(ObjectTypes.REPORT, 'review-pass', { objectId: contextId, role: session.role, item: get(ObjectTypes.REPORT, contextId) });
      handleResult(result, '审核通过', 'RM01');
      break;
    }
    case 'rm04-return': {
      const item = get(ObjectTypes.REPORT, contextId);
      const result = execute(ObjectTypes.REPORT, 'review-return', { objectId: contextId, role: session.role, item });
      handleResult(result, '已退回', 'RM01');
      break;
    }

    // ===== RM05 签发 =====
    case 'rm05-sign': {
      const item = get(ObjectTypes.REPORT, contextId);
      const signer = document.querySelector('[data-sign-field="signer"]')?.value.trim();
      if (!signer) { toast('请填写签发人', '', 'warning'); return; }
      update(ObjectTypes.REPORT, contextId, { signer });
      const result = execute(ObjectTypes.REPORT, 'sign', { objectId: contextId, role: session.role, item: get(ObjectTypes.REPORT, contextId) });
      handleResult(result, '已签发', 'RM06');
      break;
    }
    case 'rm05-return': {
      const item = get(ObjectTypes.REPORT, contextId);
      const result = execute(ObjectTypes.REPORT, 'sign-return', { objectId: contextId, role: session.role, item });
      handleResult(result, '已退回', 'RM01');
      break;
    }

    // ===== RM06 认可核验 =====
    case 'rm06-verify':
      toast('认可核验通过', '可进入发布', 'success');
      go('RM07');
      break;

    // ===== RM07 发布 =====
    case 'rm07-publish': {
      const item = get(ObjectTypes.REPORT, contextId);
      const channel = document.querySelector('[data-publish-field="channel"]')?.value;
      const recipient = document.querySelector('[data-publish-field="recipient"]')?.value.trim();
      update(ObjectTypes.REPORT, contextId, { deliveryChannel: channel });
      const result = execute(ObjectTypes.REPORT, 'publish', { objectId: contextId, role: session.role, item: get(ObjectTypes.REPORT, contextId) });
      if (result.ok) {
        toast('报告已发布', `交付渠道：${channel}，接收人：${recipient || '未指定'}`, 'success');
        // 闭环到 SM11 留样管理
        go('SM11');
      } else {
        handleResult(result, '', null);
      }
      break;
    }
    case 'rm07-fail': {
      const item = get(ObjectTypes.REPORT, contextId);
      const result = execute(ObjectTypes.REPORT, 'publish-fail', { objectId: contextId, role: session.role, item });
      handleResult(result, '发布失败已记录', 'RM07');
      break;
    }

    // ===== RM08 详情 -> 闭环 =====
    case 'rm08-goto-retention':
      updateSession({ currentContextId: contextId });
      go('SM11');
      break;

    // ===== RM09 更正 =====
    case 'rm09-correct': {
      const item = get(ObjectTypes.REPORT, contextId);
      const reason = document.querySelector('[data-correct-field="reason"]')?.value.trim();
      if (!reason) { toast('请填写更正原因', '', 'warning'); return; }
      const result = execute(ObjectTypes.REPORT, 'correct', { objectId: contextId, role: session.role, item });
      if (result.ok) {
        // 更新版本号
        const oldVer = item.version || 'V1';
        const newVer = `V${parseInt(oldVer.replace('V', '')) + 1}`;
        update(ObjectTypes.REPORT, contextId, { version: newVer });
        toast('更正已发起', `新版本 ${newVer}，需重新审核签发 [FR-REPORT-006]`, 'success');
        go('RM03');
      } else {
        handleResult(result, '', null);
      }
      break;
    }

    // ===== RM10 撤回 =====
    case 'rm10-withdraw': {
      const item = get(ObjectTypes.REPORT, contextId);
      const reason = document.querySelector('[data-withdraw-field="reason"]')?.value.trim();
      if (!reason) { toast('请填写撤回原因', '', 'warning'); return; }
      const result = execute(ObjectTypes.REPORT, 'withdraw', { objectId: contextId, role: session.role, item });
      handleResult(result, '报告已撤回', 'RM08');
      break;
    }

    // ===== RM11 归档 =====
    case 'rm11-archive': {
      const item = get(ObjectTypes.REPORT, contextId);
      const result = execute(ObjectTypes.REPORT, 'archive', { objectId: contextId, role: session.role, item });
      handleResult(result, '报告已归档', 'RM11');
      break;
    }

    default:
      break;
  }
});

// ===== 辅助函数 =====
function handleResult(result, successMsg, redirectView) {
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
