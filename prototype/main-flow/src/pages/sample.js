// 样品生命周期模块页面渲染（SM01-SM12）
// 批次3 完整实现：待接收/接收工作台/异常确认/台账/追踪详情/标签/分样/交接/存储/领用归还/留样/处置
// 包含 CC05->SM01 跨流程衔接

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

// 从 session 获取当前上下文 ID
function getContextId() {
  return getSession().currentContextId || null;
}

// ===== 主分发器 =====
export function renderSamplePage(ctx) {
  const page = Pages[ctx.currentView];
  if (!page) return emptyState('页面未定义');

  const renderers = {
    SM01: renderSM01, SM02: renderSM02, SM03: renderSM03, SM04: renderSM04, SM05: renderSM05,
    SM06: renderSM06, SM07: renderSM07, SM08: renderSM08, SM09: renderSM09,
    SM10: renderSM10, SM11: renderSM11, SM12: renderSM12,
  };
  const fn = renderers[ctx.currentView];
  return fn ? fn(page, ctx) : emptyState(`${ctx.currentView} 渲染器未注册`);
}

// ========== SM01 待接收样品（列表） ==========
function renderSM01(page, ctx) {
  // 如果从 CC05 跳转过来，可能携带委托上下文
  const commissionId = getContextId();
  let samples;
  if (commissionId) {
    // 尝试匹配委托关联的样品
    const commission = get(ObjectTypes.COMMISSION, commissionId);
    if (commission) {
      samples = list(ObjectTypes.SAMPLE, (s) => s.commissionCode === commission.code && s.status === '待接收');
    }
  }
  if (!samples) {
    samples = list(ObjectTypes.SAMPLE, (s) => s.status === '待接收');
  }

  const headerActions = button('查看全部样品', 'sm01-goto-ledger', 'secondary', 'archive');

  return heading(page.title, page.subtitle, [page.module, page.title], headerActions)
    + (samples.length === 0
      ? panel('待接收样品', emptyState('暂无待接收样品', 'package-check'))
      : panelWithActions('待接收列表', '',
        table(
          [
            { label: '样品编号', key: 'code' },
            { label: '样品名称', key: 'name' },
            { label: '委托编号', key: 'commissionCode' },
            { label: '数量', key: 'quantity' },
            { label: '运输条件', key: 'transportCondition' },
            { label: '状态', key: 'status' },
            { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
              <button class="button link primary" data-view="SM02" data-context-id="${escapeHtml(row.id)}">接收</button>
              <button class="button link secondary" data-view="SM05" data-context-id="${escapeHtml(row.id)}">追踪</button>
            </div>` },
          ],
          samples,
        ),
      ));
}

// ========== SM02 样品接收工作台 ==========
function renderSM02(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从待接收列表选择样品进行接收', 'package-x');
  }

  const flowInfo = getStepIndex('SM02');
  const stepsHtml = flowInfo.flow ? steps(flowInfo.flow.primaryPath.map((p) => Pages[p]?.title || p), flowInfo.index) : '';

  const session = getSession();
  const canReceive = session.role === '样品管理员';
  const isPending = sample.status === '待接收';

  const receiveForm = isPending
    ? `
      <div class="form-field">
        <label>包装状态 <span class="required">*</span></label>
        <select data-receive-field="packageStatus">
          <option value="">请选择</option>
          <option value="完好">完好</option>
          <option value="轻微破损">轻微破损</option>
          <option value="严重破损">严重破损</option>
        </select>
      </div>
      <div class="form-field">
        <label>运输条件 <span class="required">*</span></label>
        <input type="text" data-receive-field="transportCondition" value="${escapeHtml(sample.transportCondition || '')}" placeholder="如：常温、冷藏2-8°C" />
      </div>
      <div class="form-field">
        <label>接收结论</label>
        <select data-receive-field="receiveConclusion">
          <option value="正常接收">正常接收</option>
          <option value="有条件接收">有条件接收</option>
          <option value="拒收">拒收</option>
        </select>
      </div>
      <div class="form-field">
        <label>存储位置</label>
        <input type="text" data-receive-field="location" placeholder="如：样品库A-01" />
      </div>
    `
    : alert('info', `样品当前状态：${sample.status}，无需接收`);

  const actions = isPending && canReceive
    ? `<div class="form-actions">
        ${button('确认接收', 'sm02-receive', 'primary', 'check-circle')}
        ${button('发起异常', 'sm02-exception', 'warning', 'alert-triangle')}
      </div>`
    : isPending && !canReceive
      ? alert('warning', `当前角色"${session.role}"无权接收样品，要求角色：样品管理员`)
      : '';

  return heading(page.title, page.subtitle, [page.module, '待接收', sample.code])
    + (stepsHtml ? panel('P02 流程位置', stepsHtml) : '')
    + panel('样品基本信息', kvList(
      [{ key: 'code', label: '样品编号' }, { key: 'name', label: '样品名称' }, { key: 'commissionCode', label: '委托编号' }, { key: 'quantity', label: '数量' }, { key: 'status', label: '当前状态' }],
      sample,
    ))
    + panel('接收登记', receiveForm)
    + actions;
}

// ========== SM03 异常确认 ==========
function renderSM03(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从接收工作台发起异常', 'alert-octagon');
  }

  const session = getSession();
  const canHandle = ['样品管理员', '技术负责人'].includes(session.role);
  const isExceptionState = sample.status === '隔离中';

  const exceptionForm = `
    <div class="form-field">
      <label>异常类型 <span class="required">*</span></label>
      <select data-exception-field="type">
        <option value="">请选择</option>
        <option value="包装破损">包装破损</option>
        <option value="数量不符">数量不符</option>
        <option value="变质污染">变质污染</option>
        <option value="标识缺失">标识缺失</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-field">
      <label>异常描述</label>
      <textarea data-exception-field="description" placeholder="详细描述异常情况"></textarea>
    </div>
    <div class="form-field">
      <label>处理结论</label>
      <select data-exception-field="conclusion">
        <option value="隔离">隔离待处理</option>
        <option value="有条件接收">有条件接收</option>
        <option value="拒收">拒收</option>
      </select>
    </div>
  `;

  const actions = canHandle
    ? `<div class="form-actions">
        ${button('确认隔离', 'sm03-quarantine', 'warning', 'shield-alert')}
        ${button('有条件接收', 'sm03-conditional', 'primary', 'check')}
        ${button('返回接收', 'sm03-back', 'secondary', 'arrow-left')}
      </div>`
    : alert('warning', `当前角色"${session.role}"无权处理异常`);

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code])
    + alert(isExceptionState ? 'danger' : 'warning',
      isExceptionState
        ? `样品已隔离，隔离中样品不得进入检测 [FR-SAMPLE-002]`
        : `样品 ${escapeHtml(sample.code)} 待确认异常`,
    )
    + panel('异常登记', exceptionForm)
    + actions;
}

// ========== SM04 样品台账（列表） ==========
function renderSM04(page, ctx) {
  const samples = list(ObjectTypes.SAMPLE);

  return heading(page.title, page.subtitle, [page.module, page.title])
    + filterBar('搜索样品编号或名称...', ['待接收', '隔离中', '已接收', '已分样', '已交接', '已领用', '已归还', '留样中', '已处置'])
    + panelWithActions('样品台账', '',
      table(
        [
          { label: '样品编号', key: 'code' },
          { label: '样品名称', key: 'name' },
          { label: '委托编号', key: 'commissionCode' },
          { label: '数量', key: 'quantity' },
          { label: '存储位置', key: 'location' },
          { label: '状态', key: 'status' },
          { label: '留样期限', key: 'retentionDeadline' },
          { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
            <button class="button link secondary" data-view="SM05" data-context-id="${escapeHtml(row.id)}">追踪</button>
            ${(row.status === '已接收' || row.status === '已分样') ? `<button class="button link" data-view="SM08" data-context-id="${escapeHtml(row.id)}">交接</button>` : ''}
            ${(row.status === '已交接') ? `<button class="button link" data-view="SM10" data-context-id="${escapeHtml(row.id)}">领用</button>` : ''}
            ${(row.status === '已归还' || row.status === '留样中') ? `<button class="button link" data-view="SM11" data-context-id="${escapeHtml(row.id)}">留样</button>` : ''}
          </div>` },
        ],
        samples,
      ),
    );
}

// ========== SM05 样品追踪详情 ==========
function renderSM05(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从样品台账选择样品查看追踪', 'search-x');
  }

  const fields = Schemas[ObjectTypes.SAMPLE].fields;
  const detail = kvList(fields, sample);
  const flowInfo = getStepIndex('SM05');
  const stepsHtml = flowInfo.flow ? steps(flowInfo.flow.primaryPath.map((p) => Pages[p]?.title || p), flowInfo.index) : '';
  // 计算处置影响：法律冻结/未完成任务阻断 [FR-SAMPLE-005]
  const sampleImpact = computeSampleImpact(sample);
  const actions = availableActions(ObjectTypes.SAMPLE, sample, { impact: sampleImpact });

  // 根据状态生成操作按钮
  const actionButtons = actions.map((a) => {
    const actionMap = {
      'receive': { label: '接收', icon: 'package-check', view: 'SM02' },
      'exception': { label: '发起异常', icon: 'alert-triangle', view: 'SM03' },
      'conditional-receive': { label: '有条件接收', icon: 'check', view: 'SM03' },
      'label': { label: '生成标签', icon: 'tag', view: 'SM06' },
      'aliquot': { label: '分样', icon: 'split', view: 'SM07' },
      'handover': { label: '交接', icon: 'arrow-right-left', view: 'SM08' },
      'checkout': { label: '领用', icon: 'hand', view: 'SM10' },
      'return': { label: '归还', icon: 'undo-2', view: 'SM10' },
      'retain': { label: '留样', icon: 'archive', view: 'SM11' },
      'dispose': { label: '处置', icon: 'trash-2', view: 'SM12' },
    };
    const meta = actionMap[a.action] || { label: a.label, icon: 'circle', view: null };
    if (meta.view) {
      return `<button class="button primary" data-view="${meta.view}" data-context-id="${escapeHtml(sample.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`;
    }
    return '';
  }).join('');

  // 生命周期时间线
  const lifecycleItems = [];
  if (sample.receivedAt) lifecycleItems.push({ time: sample.receivedAt, title: '样品接收', detail: `${sample.receiveConclusion || '正常接收'} · 接收人 ${sample.receivedBy || ''}` });
  if (sample.status === '已分样') lifecycleItems.push({ time: '', title: '分样', detail: '已完成分样操作' });
  if (['已交接', '已领用', '已归还'].includes(sample.status)) lifecycleItems.push({ time: '', title: '样品交接', detail: '已交接给检测员' });
  if (['已领用', '已归还'].includes(sample.status)) lifecycleItems.push({ time: '', title: '样品领用', detail: '检测员已领用' });
  if (sample.status === '已归还') lifecycleItems.push({ time: '', title: '样品归还', detail: '检测员已归还' });
  if (['留样中', '已处置'].includes(sample.status)) lifecycleItems.push({ time: '', title: '留样', detail: `留样期限：${sample.retentionDeadline || '未设置'}` });
  if (sample.status === '已处置') lifecycleItems.push({ time: '', title: '处置', detail: '已完成处置' });

  return heading(page.title, page.subtitle, [page.module, '样品台账', sample.code], actionButtons)
    + (stepsHtml ? panel('P02 流程位置', stepsHtml) : '')
    + `<div class="grid two">
      ${panel('样品信息', detail)}
      ${panel('生命周期', timeline(lifecycleItems))}
    </div>`;
}

// ========== SM06 样品标签 ==========
function renderSM06(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择样品生成标签', 'tag');
  }

  const labelInfo = `
    <div class="sample-label-preview">
      <div class="label-item">
        <strong>${escapeHtml(sample.code)}</strong>
        <span>${escapeHtml(sample.name)}</span>
        <span>数量：${escapeHtml(sample.quantity || '')}</span>
        <span>委托：${escapeHtml(sample.commissionCode || '')}</span>
      </div>
    </div>
  `;

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code],
    button('生成/补打标签', 'sm06-print', 'primary', 'printer'))
    + panel('标签预览', labelInfo)
    + panel('标签信息', kvList(
      [{ key: 'code', label: '样品编号' }, { key: 'name', label: '样品名称' }, { key: 'quantity', label: '数量' }, { key: 'commissionCode', label: '委托编号' }],
      sample,
    ));
}

// ========== SM07 分样 ==========
function renderSM07(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择样品进行分样', 'split');
  }

  const session = getSession();
  const canAliquot = session.role === '样品管理员';
  const canDoStatus = sample.status === '已接收';

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code])
    + panel('原样信息', kvList(
      [{ key: 'code', label: '样品编号' }, { key: 'name', label: '样品名称' }, { key: 'quantity', label: '数量' }, { key: 'status', label: '当前状态' }],
      sample,
    ))
    + panel('分样登记', `
      <div class="form-field">
        <label>分样数量 <span class="required">*</span></label>
        <input type="number" data-aliquot-field="count" min="2" placeholder="拆分为几份" />
      </div>
      <div class="form-field">
        <label>分样说明</label>
        <textarea data-aliquot-field="note" placeholder="分样方法、子样用途等"></textarea>
      </div>
    `)
    + (canDoStatus && canAliquot
      ? `<div class="form-actions">${button('确认分样', 'sm07-aliquot', 'primary', 'check')}</div>`
      : !canDoStatus
        ? alert('info', `样品当前状态：${sample.status}，仅"已接收"状态可分样`)
        : alert('warning', `当前角色"${session.role}"无权分样，要求角色：样品管理员`));
}

// ========== SM08 样品交接 ==========
function renderSM08(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择样品进行交接', 'arrow-right-left');
  }

  const session = getSession();
  const canHandover = ['样品管理员', '检测员'].includes(session.role);
  const canDoStatus = ['已接收', '已分样'].includes(sample.status);

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code])
    + panel('样品信息', kvList(
      [{ key: 'code', label: '样品编号' }, { key: 'name', label: '样品名称' }, { key: 'quantity', label: '数量' }, { key: 'status', label: '当前状态' }],
      sample,
    ))
    + panel('交接登记', `
      <div class="form-field">
        <label>交出人</label>
        <input type="text" value="${escapeHtml(session.role)}" disabled />
      </div>
      <div class="form-field">
        <label>接收人 <span class="required">*</span></label>
        <input type="text" data-handover-field="receiver" placeholder="检测员姓名" />
      </div>
      <div class="form-field">
        <label>交接确认</label>
        <select data-handover-field="confirm">
          <option value="确认完好">确认完好</option>
          <option value="有异议">有异议</option>
        </select>
      </div>
    `)
    + (canDoStatus && canHandover
      ? `<div class="form-actions">${button('确认交接', 'sm08-handover', 'primary', 'check')}</div>`
      : !canDoStatus
        ? alert('info', `样品当前状态：${sample.status}，仅"已接收/已分样"状态可交接`)
        : alert('warning', `当前角色"${session.role}"无权操作交接`));
}

// ========== SM09 样品存储 ==========
function renderSM09(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择样品管理存储', 'archive');
  }

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code],
    button('更新存储', 'sm09-save', 'primary', 'save'))
    + panel('存储信息', `
      <div class="form-field">
        <label>存储位置</label>
        <input type="text" data-storage-field="location" value="${escapeHtml(sample.location || '')}" placeholder="如：样品库A-01" />
      </div>
      <div class="form-field">
        <label>环境条件</label>
        <input type="text" data-storage-field="environment" placeholder="如：常温、避光" />
      </div>
      <div class="form-field">
        <label>留样期限</label>
        <input type="date" data-storage-field="retentionDeadline" value="${escapeHtml(sample.retentionDeadline || '')}" />
      </div>
    `);
}

// ========== SM10 领用与归还 ==========
function renderSM10(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择样品进行领用或归还', 'hand');
  }

  const session = getSession();
  const isHandover = sample.status === '已交接';
  const isCheckedOut = sample.status === '已领用';
  const canCheckout = session.role === '检测员';
  const canReturn = ['检测员', '样品管理员'].includes(session.role);

  let actionHtml = '';
  if (isHandover && canCheckout) {
    actionHtml = `<div class="form-actions">
      ${button('确认领用', 'sm10-checkout', 'primary', 'hand')}
      ${button('进入检测任务', 'sm10-goto-task', 'brand', 'flask-conical')}
    </div>`;
  } else if (isCheckedOut && canReturn) {
    actionHtml = `<div class="form-actions">
      ${button('确认归还', 'sm10-return', 'primary', 'undo-2')}
    </div>`;
  } else if (!canCheckout && isHandover) {
    actionHtml = alert('warning', `当前角色"${session.role}"无权领用，要求角色：检测员`);
  } else {
    actionHtml = alert('info', `样品当前状态：${sample.status}`);
  }

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code])
    + panel('样品信息', kvList(
      [{ key: 'code', label: '样品编号' }, { key: 'name', label: '样品名称' }, { key: 'status', label: '当前状态' }, { key: 'location', label: '存储位置' }],
      sample,
    ))
    + actionHtml;
}

// ========== SM11 留样管理 ==========
function renderSM11(page, ctx) {
  const retained = list(ObjectTypes.SAMPLE, (s) => ['留样中', '已归还'].includes(s.status));

  return heading(page.title, page.subtitle, [page.module, page.title])
    + filterBar('搜索样品编号...', ['留样中', '已归还'])
    + (retained.length > 0
      ? panelWithActions('留样列表', '',
        table(
          [
            { label: '样品编号', key: 'code' },
            { label: '样品名称', key: 'name' },
            { label: '留样期限', key: 'retentionDeadline' },
            { label: '存储位置', key: 'location' },
            { label: '状态', key: 'status' },
            { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
              ${row.status === '已归还' ? `<button class="button link primary" data-action="sm11-retain" data-context-id="${escapeHtml(row.id)}">留样</button>` : ''}
              ${row.status === '留样中' ? `<button class="button link" data-view="SM12" data-context-id="${escapeHtml(row.id)}">处置</button>` : ''}
              <button class="button link secondary" data-view="SM09" data-context-id="${escapeHtml(row.id)}">延期</button>
            </div>` },
          ],
          retained,
        ),
      )
      : panel('留样列表', emptyState('暂无留样样品', 'archive')));
}

// ========== SM12 样品处置 ==========
function renderSM12(page, ctx) {
  const id = ctx.contextId || getContextId();
  const sample = id ? get(ObjectTypes.SAMPLE, id) : null;

  if (!sample) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从留样列表选择样品进行处置', 'trash-2');
  }

  const session = getSession();
  const canDispose = ['样品管理员', '质量负责人'].includes(session.role);
  const canDoStatus = ['留样中', '已归还'].includes(sample.status);

  // 检查前置条件（法律冻结、未完成任务）
  const data = getData();
  const hasPendingTask = data.tasks.some((t) => t.sampleCode === sample.code && !['已完成'].includes(t.status));
  const hasLegalHold = sample.legalHold === true;

  const blocked = hasLegalHold || hasPendingTask;

  return heading(page.title, page.subtitle, [page.module, '样品', sample.code])
    + panel('样品信息', kvList(
      [{ key: 'code', label: '样品编号' }, { key: 'name', label: '样品名称' }, { key: 'status', label: '当前状态' }, { key: 'retentionDeadline', label: '留样期限' }],
      sample,
    ))
    + panel('处置登记', `
      <div class="form-field">
        <label>处置方式 <span class="required">*</span></label>
        <select data-dispose-field="method">
          <option value="">请选择</option>
          <option value="销毁">销毁</option>
          <option value="退还客户">退还客户</option>
          <option value="延长留样">延长留样</option>
        </select>
      </div>
      <div class="form-field">
        <label>处置原因</label>
        <textarea data-dispose-field="reason" placeholder="留样到期/客户要求退还等"></textarea>
      </div>
      <div class="form-field">
        <label>见证人 <span class="required">*</span></label>
        <input type="text" data-dispose-field="witness" placeholder="销毁需双人见证 [TBD-待确认]" />
      </div>
    `)
    + (blocked
      ? alert('danger', hasLegalHold
        ? '样品被法律冻结，禁止销毁 [FR-SAMPLE-005]'
        : '存在未完成任务，禁止销毁 [FR-SAMPLE-005]')
      : canDoStatus && canDispose
        ? `<div class="form-actions">${button('确认处置', 'sm12-dispose', 'danger', 'trash-2')}</div>`
        : !canDoStatus
          ? alert('info', `样品当前状态：${sample.status}，仅"留样中/已归还"状态可处置`)
          : alert('warning', `当前角色"${session.role}"无权处置，要求角色：样品管理员/质量负责人`));
}

// ====================================================================
// 页面级动作处理
// ====================================================================
document.addEventListener('cnas:action', (event) => {
  const { action, el } = event.detail;
  const contextId = el?.getAttribute('data-context-id') || getContextId();
  const session = getSession();

  switch (action) {
    // ===== SM01 =====
    case 'sm01-goto-ledger':
      go('SM04');
      break;

    // ===== SM02 接收 =====
    case 'sm02-receive': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const fields = {};
      document.querySelectorAll('[data-receive-field]').forEach((f) => { fields[f.dataset.receiveField] = f.value.trim(); });
      if (!fields.packageStatus) { toast('请选择包装状态', '', 'warning'); return; }
      if (!fields.transportCondition) { toast('请填写运输条件', '', 'warning'); return; }
      // 先更新字段
      update(ObjectTypes.SAMPLE, contextId, {
        packageStatus: fields.packageStatus,
        transportCondition: fields.transportCondition,
        receiveConclusion: fields.receiveConclusion || '正常接收',
        location: fields.location,
        receivedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        receivedBy: session.role,
      });
      const result = execute(ObjectTypes.SAMPLE, 'receive', { objectId: contextId, role: session.role, item: get(ObjectTypes.SAMPLE, contextId) });
      handleResult(result, '样品已接收', 'SM04');
      break;
    }
    case 'sm02-exception':
      updateSession({ currentContextId: contextId });
      go('SM03');
      break;

    // ===== SM03 异常 =====
    case 'sm03-quarantine': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const result = execute(ObjectTypes.SAMPLE, 'exception', { objectId: contextId, role: session.role, item });
      handleResult(result, '样品已隔离', 'SM04');
      break;
    }
    case 'sm03-conditional': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const result = execute(ObjectTypes.SAMPLE, 'conditional-receive', { objectId: contextId, role: session.role, item });
      handleResult(result, '有条件接收完成', 'SM04');
      break;
    }
    case 'sm03-back':
      go('SM02');
      break;

    // ===== SM06 标签 =====
    case 'sm06-print': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const result = execute(ObjectTypes.SAMPLE, 'label', { objectId: contextId, role: session.role, item });
      handleResult(result, '标签已生成', 'SM05');
      break;
    }

    // ===== SM07 分样 =====
    case 'sm07-aliquot': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const count = parseInt(document.querySelector('[data-aliquot-field="count"]')?.value || '0', 10);
      if (count < 2) { toast('分样数量至少为2', '', 'warning'); return; }
      const result = execute(ObjectTypes.SAMPLE, 'aliquot', { objectId: contextId, role: session.role, item });
      if (result.ok) {
        toast('分样完成', `已拆分为 ${count} 份子样品`, 'success');
        go('SM05');
      } else {
        handleResult(result, '', null);
      }
      break;
    }

    // ===== SM08 交接 =====
    case 'sm08-handover': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const receiver = document.querySelector('[data-handover-field="receiver"]')?.value.trim();
      if (!receiver) { toast('请填写接收人', '', 'warning'); return; }
      const result = execute(ObjectTypes.SAMPLE, 'handover', { objectId: contextId, role: session.role, item });
      handleResult(result, '样品已交接', 'SM04');
      break;
    }

    // ===== SM09 存储 =====
    case 'sm09-save': {
      const fields = {};
      document.querySelectorAll('[data-storage-field]').forEach((f) => { fields[f.dataset.storageField] = f.value.trim(); });
      update(ObjectTypes.SAMPLE, contextId, fields);
      toast('存储信息已更新', '', 'success');
      go('SM05');
      break;
    }

    // ===== SM10 领用/归还 =====
    case 'sm10-checkout': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const result = execute(ObjectTypes.SAMPLE, 'checkout', { objectId: contextId, role: session.role, item });
      handleResult(result, '样品已领用', 'SM04');
      break;
    }
    case 'sm10-return': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const result = execute(ObjectTypes.SAMPLE, 'return', { objectId: contextId, role: session.role, item });
      handleResult(result, '样品已归还', 'SM04');
      break;
    }
    case 'sm10-goto-task':
      updateSession({ currentContextId: contextId });
      go('TM01');
      break;

    // ===== SM11 留样 =====
    case 'sm11-retain': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const result = execute(ObjectTypes.SAMPLE, 'retain', { objectId: contextId, role: session.role, item });
      handleResult(result, '已留样', 'SM11');
      break;
    }

    // ===== SM12 处置 =====
    case 'sm12-dispose': {
      const item = get(ObjectTypes.SAMPLE, contextId);
      const witness = document.querySelector('[data-dispose-field="witness"]')?.value.trim();
      if (!witness) { toast('请填写见证人', '销毁需双人见证 [TBD-待确认]', 'warning'); return; }
      const method = document.querySelector('[data-dispose-field="method"]')?.value;
      if (!method) { toast('请选择处置方式', '', 'warning'); return; }
      // 计算处置影响：法律冻结/未完成任务阻断 [FR-SAMPLE-005]
      const impact = computeSampleImpact(item);
      const result = execute(ObjectTypes.SAMPLE, 'dispose', { objectId: contextId, role: session.role, item, impact });
      handleResult(result, '处置完成', 'SM11');
      break;
    }

    default:
      break;
  }
});

// ===== 辅助函数 =====
// 计算样品处置影响：法律冻结、未完成任务阻断销毁 [FR-SAMPLE-005]
function computeSampleImpact(sample) {
  const data = getData();
  // 该样品是否关联未完成任务（非已完成/已退回视为未完成）
  const hasPendingTask = data.tasks.some(
    (t) => t.sampleCode === sample.code && !['已完成', '已退回'].includes(t.status),
  );
  // legalHold 字段未在 schema 定义，预留扩展点（当前恒 false）
  const hasLegalHold = !!sample.legalHold;
  return { hasPendingTask, hasLegalHold };
}

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
