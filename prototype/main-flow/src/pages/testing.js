// 检测执行与结果放行模块页面渲染（TM01-TM14）
// 批次4 完整实现：任务列表/排程/详情/开工/原始记录/仪器导入/数据计算/资源核验/异常/复检/结果汇总/复核/质控放行/完成归档
// 包含 SM10->TM01 跨流程衔接

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
export function renderTestingPage(ctx) {
  const page = Pages[ctx.currentView];
  if (!page) return emptyState('页面未定义');

  const renderers = {
    TM01: renderTM01, TM02: renderTM02, TM03: renderTM03, TM04: renderTM04, TM05: renderTM05,
    TM06: renderTM06, TM07: renderTM07, TM08: renderTM08, TM09: renderTM09, TM10: renderTM10,
    TM11: renderTM11, TM12: renderTM12, TM13: renderTM13, TM14: renderTM14,
  };
  const fn = renderers[ctx.currentView];
  return fn ? fn(page, ctx) : emptyState(`${ctx.currentView} 渲染器未注册`);
}

// ========== TM01 检测任务列表 ==========
function renderTM01(page, ctx) {
  const tasks = list(ObjectTypes.TASK);

  return heading(page.title, page.subtitle, [page.module, page.title], button('刷新', 'tm01-refresh', 'secondary', 'refresh-cw'))
    + filterBar('搜索任务编号或检测项目...', ['待排程', '待开工', '执行中', '异常暂停', '待复核', '已完成', '已退回'])
    + panelWithActions('任务列表', '',
      table(
        [
          { label: '任务编号', key: 'code' },
          { label: '委托编号', key: 'commissionCode' },
          { label: '样品编号', key: 'sampleCode' },
          { label: '检测项目', key: 'testItems' },
          { label: '执行人', key: 'executor' },
          { label: '复核人', key: 'reviewer' },
          { label: '状态', key: 'status' },
          { label: '操作', key: 'actions', render: (row) => `<div class="row-actions">
            <button class="button link secondary" data-view="TM03" data-context-id="${escapeHtml(row.id)}">详情</button>
            ${row.status === '待排程' ? `<button class="button link" data-view="TM02" data-context-id="${escapeHtml(row.id)}">排程</button>` : ''}
            ${row.status === '待开工' ? `<button class="button link" data-view="TM04" data-context-id="${escapeHtml(row.id)}">开工</button>` : ''}
            ${row.status === '执行中' ? `<button class="button link" data-view="TM05" data-context-id="${escapeHtml(row.id)}">记录</button>` : ''}
            ${row.status === '待复核' ? `<button class="button link" data-view="TM12" data-context-id="${escapeHtml(row.id)}">复核</button>` : ''}
          </div>` },
        ],
        tasks,
      ),
    );
}

// ========== TM02 任务排程 ==========
function renderTM02(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从任务列表选择待排程任务', 'calendar-x');
  }

  const session = getSession();
  const canSchedule = session.role === '技术负责人';
  const isPending = task.status === '待排程';

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'commissionCode', label: '委托编号' }, { key: 'sampleCode', label: '样品编号' }, { key: 'testItems', label: '检测项目' }, { key: 'method', label: '检测方法' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + panel('排程登记', `
      <div class="form-field">
        <label>执行人 <span class="required">*</span></label>
        <input type="text" data-schedule-field="executor" value="${escapeHtml(task.executor || '')}" placeholder="检测员姓名" />
      </div>
      <div class="form-field">
        <label>复核人 <span class="required">*</span></label>
        <input type="text" data-schedule-field="reviewer" value="${escapeHtml(task.reviewer || '')}" placeholder="复核人姓名（禁止与执行人相同）" />
      </div>
      <div class="form-field">
        <label>计划时间</label>
        <input type="date" data-schedule-field="plannedDate" value="${escapeHtml(task.plannedDate || '')}" />
      </div>
    `)
    + (isPending && canSchedule
      ? `<div class="form-actions">${button('确认排程', 'tm02-schedule', 'primary', 'check-circle')}</div>`
      : isPending && !canSchedule
        ? alert('warning', `当前角色"${session.role}"无权排程，要求角色：技术负责人`)
        : alert('info', `任务当前状态：${task.status}`));
}

// ========== TM03 任务详情 ==========
function renderTM03(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从任务列表选择任务查看详情', 'file-x');
  }

  const fields = Schemas[ObjectTypes.TASK].fields;
  const detail = kvList(fields, task);
  const data = getData();
  const records = data.records.filter((r) => r.taskCode === task.code);
  // 计算异常影响：未处理异常阻断提交/复核 [FR-RECORD-005]
  const taskImpact = computeTaskImpact(task);
  const actions = availableActions(ObjectTypes.TASK, task, { impact: taskImpact });
  const flowInfo = getStepIndex('TM03');
  const stepsHtml = flowInfo.flow ? steps(flowInfo.flow.primaryPath.map((p) => Pages[p]?.title || p), flowInfo.index) : '';

  const actionButtons = actions.map((a) => {
    const actionMap = {
      'schedule': { label: '排程', icon: 'calendar', view: 'TM02' },
      'start': { label: '开工', icon: 'play', view: 'TM04' },
      'exception': { label: '记录异常', icon: 'alert-triangle', view: 'TM09' },
      'recover': { label: '恢复执行', icon: 'rotate-ccw', view: null },
      'submit-review': { label: '提交复核', icon: 'send', view: null },
      'review-pass': { label: '复核通过', icon: 'check-circle', view: 'TM12' },
      'review-return': { label: '退回补充', icon: 'x-circle', view: 'TM12' },
    };
    const meta = actionMap[a.action] || { label: a.label, icon: 'circle', view: null };
    if (meta.view) {
      return `<button class="button primary" data-view="${meta.view}" data-context-id="${escapeHtml(task.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`;
    }
    return `<button class="button primary" data-action="tm03-execute" data-execute-action="${escapeHtml(a.action)}" data-context-id="${escapeHtml(task.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`;
  }).join('');

  // 任务生命周期时间线
  const lifecycleItems = [];
  if (task.status !== '待排程') lifecycleItems.push({ time: '', title: '任务排程', detail: `执行人：${task.executor}，复核人：${task.reviewer}` });
  if (['待开工', '执行中', '异常暂停', '待复核', '已完成', '已退回'].includes(task.status)) lifecycleItems.push({ time: '', title: '任务开工', detail: '资源核验通过' });
  if (['异常暂停'].includes(task.status)) lifecycleItems.push({ time: '', title: '异常暂停', detail: '检测过程发现异常', state: 'danger' });
  if (['待复核', '已完成'].includes(task.status)) lifecycleItems.push({ time: '', title: '提交复核', detail: '原始记录已提交' });
  if (['已完成'].includes(task.status)) lifecycleItems.push({ time: '', title: '复核通过', detail: '结果已放行' });

  return heading(page.title, page.subtitle, [page.module, '任务列表', task.code], actionButtons)
    + (stepsHtml ? panel('P03 流程位置', stepsHtml) : '')
    + `<div class="grid two">
      ${panel('任务信息', detail)}
      ${panel('生命周期', timeline(lifecycleItems))}
    </div>`
    + (records.length > 0 ? panel('原始记录', table(
      [{ label: '记录编号', key: 'code' }, { label: '版本', key: 'version' }, { label: '记录人', key: 'recordedBy' }, { label: '状态', key: 'status' }],
      records,
    )) : '');
}

// ========== TM04 任务开工 ==========
function renderTM04(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从任务列表选择待开工任务', 'play');
  }

  const session = getSession();
  const canStart = ['检测员', '技术负责人'].includes(session.role);
  const canDoStatus = ['待开工', '已退回'].includes(task.status);

  const resourceChecks = [
    { item: '人员授权', status: task.resourceValid === '通过' ? '通过' : '待校验', note: '执行人检测授权有效' },
    { item: '设备校准', status: '通过', note: '设备在校准有效期内' },
    { item: '方法有效性', status: '通过', note: '方法标准现行有效' },
    { item: '环境条件', status: '通过', note: '环境条件满足要求' },
    { item: '物料', status: '通过', note: '试剂/标准物质有效' },
  ];

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'testItems', label: '检测项目' }, { key: 'executor', label: '执行人' }, { key: 'reviewer', label: '复核人' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + panel('资源核验', table(
      [{ label: '核验项', key: 'item' }, { label: '结论', key: 'status' }, { label: '说明', key: 'note' }],
      resourceChecks,
    ))
    + (canDoStatus && canStart
      ? (task.resourceValid === '阻断'
        ? alert('danger', '资源校验未通过，已阻断 [FR-TASK-002/RULE-008]')
        : `<div class="form-actions">${button('确认开工', 'tm04-start', 'primary', 'play')}</div>`)
      : !canDoStatus
        ? alert('info', `任务当前状态：${task.status}，仅"待开工/已退回"状态可开工`)
        : alert('warning', `当前角色"${session.role}"无权开工`));
}

// ========== TM05 原始记录 ==========
function renderTM05(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从任务列表选择执行中任务', 'file-text');
  }

  const session = getSession();
  const data = getData();
  const existingRecord = data.records.find((r) => r.taskCode === task.code && r.status !== '已锁定');
  const canEdit = ['执行中', '已退回'].includes(task.status);
  const canSubmit = task.status === '执行中' && session.role === '检测员';

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'testItems', label: '检测项目' }, { key: 'method', label: '检测方法' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + panel('原始记录', `
      ${existingRecord ? `<div class="kv-list">
        <div class="kv-item"><span class="kv-label">记录编号</span><span class="kv-value">${escapeHtml(existingRecord.code)}</span></div>
        <div class="kv-item"><span class="kv-label">版本</span><span class="kv-value">${escapeHtml(existingRecord.version)}</span></div>
        <div class="kv-item"><span class="kv-label">记录人</span><span class="kv-value">${escapeHtml(existingRecord.recordedBy)}</span></div>
        <div class="kv-item"><span class="kv-label">状态</span><span class="kv-value">${escapeHtml(existingRecord.status)}</span></div>
      </div>` : ''}
      <div class="form-field">
        <label>测量数据</label>
        <textarea data-record-field="data" placeholder="如：pH=7.2; 铅<0.005mg/L">${escapeHtml(existingRecord?.data || '')}</textarea>
      </div>
      <div class="form-field">
        <label>计算结果</label>
        <textarea data-record-field="result" placeholder="如：全部符合GB 5749限值">${escapeHtml(existingRecord?.calculatedResult || '')}</textarea>
      </div>
    `)
    + (canEdit
      ? `<div class="form-actions">
          ${button('保存记录', 'tm05-save', 'secondary', 'save')}
          ${canSubmit ? button('提交复核', 'tm05-submit', 'primary', 'send') : ''}
          ${button('仪器导入', 'tm05-goto-instrument', 'secondary', 'upload')}
          ${button('记录异常', 'tm05-goto-exception', 'warning', 'alert-triangle')}
        </div>`
      : alert('info', `任务当前状态：${task.status}，仅"执行中/已退回"状态可编辑记录`));
}

// ========== TM06 仪器数据导入 ==========
function renderTM06(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择任务导入仪器数据', 'upload');
  }

  return heading(page.title, page.subtitle, [page.module, '任务', task.code],
    button('模拟导入', 'tm06-import', 'primary', 'download'))
    + panel('仪器数据导入', `
      <div class="form-field">
        <label>仪器编号</label>
        <input type="text" data-instrument-field="instrumentId" placeholder="如：ICP-MS-001" />
      </div>
      <div class="form-field">
        <label>数据文件</label>
        <input type="text" data-instrument-field="file" placeholder="如：20260725_pH_data.csv" />
      </div>
      <div class="alert info">${icon('info')}<div>演示原型不支持真实文件上传，点击"模拟导入"将生成示例数据。</div></div>
    `);
}

// ========== TM07 数据计算 ==========
function renderTM07(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择任务进行数据计算', 'calculator');
  }

  return heading(page.title, page.subtitle, [page.module, '任务', task.code],
    button('执行计算', 'tm07-calculate', 'primary', 'calculator'))
    + panel('数据计算', `
      <div class="form-field">
        <label>计算公式</label>
        <input type="text" data-calc-field="formula" placeholder="如：C = (A - A0) / (k × V)" />
      </div>
      <div class="form-field">
        <label>输入数据</label>
        <textarea data-calc-field="input" placeholder="如：A=0.234, A0=0.012, k=0.95, V=50ml"></textarea>
      </div>
      <div class="form-field">
        <label>计算结果</label>
        <textarea data-calc-field="output" placeholder="计算后自动填充"></textarea>
      </div>
      <div class="form-field">
        <label>不确定度</label>
        <input type="text" data-calc-field="uncertainty" placeholder="如：U=0.02 (k=2)" />
      </div>
    `);
}

// ========== TM08 资源核验 ==========
function renderTM08(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择任务进行资源核验', 'shield-check');
  }

  return heading(page.title, page.subtitle, [page.module, '任务', task.code],
    button('更新核验结果', 'tm08-update', 'primary', 'save'))
    + panel('资源核验', `
      <div class="form-field">
        <label>人员授权</label>
        <select data-verify-field="personnel">
          <option value="通过">通过</option>
          <option value="阻断">阻断</option>
          <option value="待校验">待校验</option>
        </select>
      </div>
      <div class="form-field">
        <label>设备校准</label>
        <select data-verify-field="equipment">
          <option value="通过">通过</option>
          <option value="阻断">阻断</option>
        </select>
      </div>
      <div class="form-field">
        <label>方法有效性</label>
        <select data-verify-field="method">
          <option value="通过">通过</option>
          <option value="阻断">阻断</option>
        </select>
      </div>
      <div class="form-field">
        <label>环境条件</label>
        <select data-verify-field="environment">
          <option value="通过">通过</option>
          <option value="阻断">阻断</option>
        </select>
      </div>
      <div class="form-field">
        <label>综合核验结论</label>
        <select data-verify-field="overall">
          <option value="通过">通过 - 允许开工</option>
          <option value="阻断">阻断 - 禁止开工</option>
          <option value="待校验">待校验</option>
        </select>
      </div>
    `);
}

// ========== TM09 异常处理 ==========
function renderTM09(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从原始记录页面发起异常', 'alert-octagon');
  }

  const session = getSession();
  const canHandle = ['检测员', '技术负责人'].includes(session.role);
  const isException = task.status === '异常暂停';

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + alert(isException ? 'danger' : 'warning',
      isException ? `任务已暂停，异常类型：${escapeHtml(task.exceptionFlag || '未指定')}` : `任务 ${escapeHtml(task.code)} 登记异常`,
    )
    + panel('异常登记', `
      <div class="form-field">
        <label>异常类型 <span class="required">*</span></label>
        <select data-exception-field="type">
          <option value="">请选择</option>
          <option value="设备故障">设备故障</option>
          <option value="样品异常">样品异常</option>
          <option value="数据异常">数据异常</option>
          <option value="环境偏离">环境偏离</option>
          <option value="方法偏离">方法偏离</option>
        </select>
      </div>
      <div class="form-field">
        <label>异常描述</label>
        <textarea data-exception-field="description" placeholder="详细描述异常情况"></textarea>
      </div>
      <div class="form-field">
        <label>处理结论</label>
        <select data-exception-field="conclusion">
          <option value="恢复">恢复执行</option>
          <option value="复检">需要复检</option>
          <option value="重测">需要重测</option>
        </select>
      </div>
    `)
    + (canHandle
      ? `<div class="form-actions">
          ${isException ? button('恢复执行', 'tm09-recover', 'primary', 'rotate-ccw') : button('确认异常', 'tm09-confirm', 'warning', 'alert-triangle')}
          ${button('发起复检', 'tm09-goto-recheck', 'secondary', 'repeat')}
        </div>`
      : alert('warning', `当前角色"${session.role}"无权处理异常`));
}

// ========== TM10 复检/重测 ==========
function renderTM10(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请从异常处理页面进入复检', 'repeat');
  }

  const session = getSession();
  const canApprove = ['技术负责人', '质量负责人'].includes(session.role);

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('原任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'testItems', label: '检测项目' }, { key: 'executor', label: '执行人' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + panel('复检登记', `
      <div class="form-field">
        <label>复检原因 <span class="required">*</span></label>
        <textarea data-recheck-field="reason" placeholder="说明需要复检的原因"></textarea>
      </div>
      <div class="form-field">
        <label>复检范围</label>
        <input type="text" data-recheck-field="scope" placeholder="如：全部项目/部分项目" />
      </div>
    `)
    + (canApprove
      ? `<div class="form-actions">${button('批准并生成关联任务', 'tm10-approve', 'primary', 'check-circle')}</div>`
      : alert('warning', `当前角色"${session.role}"无权批准复检，要求角色：技术负责人/质量负责人`));
}

// ========== TM11 结果汇总 ==========
function renderTM11(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择任务查看结果汇总', 'clipboard-list');
  }

  const data = getData();
  const records = data.records.filter((r) => r.taskCode === task.code);

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'testItems', label: '检测项目' }, { key: 'method', label: '检测方法' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + panel('结果汇总', records.length > 0
      ? table(
        [{ label: '记录编号', key: 'code' }, { label: '版本', key: 'version' }, { label: '测量数据', key: 'data' }, { label: '计算结果', key: 'calculatedResult' }, { label: '记录人', key: 'recordedBy' }, { label: '状态', key: 'status' }],
        records,
      )
      : emptyState('暂无原始记录'));
}

// ========== TM12 结果复核 ==========
function renderTM12(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择待复核任务', 'clipboard-check');
  }

  const session = getSession();
  const data = getData();
  const records = data.records.filter((r) => r.taskCode === task.code);
  const canReview = session.role === '复核人' || session.role === '技术负责人';
  const isPending = task.status === '待复核';

  // 职责分离校验
  const separationIssue = task.reviewer === task.executor;

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + (separationIssue ? alert('danger', '复核人与执行人相同，违反职责分离规则 [RULE: 职责分离]') : '')
    + panel('任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'testItems', label: '检测项目' }, { key: 'executor', label: '执行人' }, { key: 'reviewer', label: '复核人' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + panel('原始记录', records.length > 0
      ? table(
        [{ label: '记录编号', key: 'code' }, { label: '数据', key: 'data' }, { label: '结果', key: 'calculatedResult' }, { label: '状态', key: 'status' }],
        records,
      )
      : emptyState('暂无记录'))
    + panel('复核登记', `
      <div class="form-field">
        <label>复核意见</label>
        <textarea data-review-field="opinion" placeholder="复核意见"></textarea>
      </div>
    `)
    + (isPending && canReview && !separationIssue
      ? `<div class="form-actions">
          ${button('复核通过', 'tm12-pass', 'primary', 'check-circle')}
          ${button('退回补充', 'tm12-return', 'warning', 'x-circle')}
        </div>`
      : isPending && !canReview
        ? alert('warning', `当前角色"${session.role}"无权复核，要求角色：复核人或技术负责人（演示环境无独立复核人角色，请切换为技术负责人）`)
        : !isPending
          ? alert('info', `任务当前状态：${task.status}`)
          : '');
}

// ========== TM13 质控放行 ==========
function renderTM13(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择任务进行质控放行', 'shield-check');
  }

  const session = getSession();
  const canRelease = ['质量负责人', '技术负责人'].includes(session.role);

  const qcItems = [
    { item: '质控样品', result: '合格', status: '通过', note: '平行样偏差<5%' },
    { item: '空白试验', result: '合格', status: '通过', note: '空白值低于检出限' },
    { item: '加标回收', result: '95%-105%', status: '通过', note: '回收率在控制范围' },
    { item: '标准物质', result: '合格', status: '通过', note: '标准物质测定值在范围内' },
  ];

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('质控数据', table(
      [{ label: '质控项', key: 'item' }, { label: '结果', key: 'result' }, { label: '结论', key: 'status' }, { label: '说明', key: 'note' }],
      qcItems,
    ))
    + (canRelease
      ? `<div class="form-actions">${button('确认放行', 'tm13-release', 'primary', 'check-check')}</div>`
      : alert('warning', `当前角色"${session.role}"无权放行，要求角色：质量负责人/技术负责人`));
}

// ========== TM14 完成归档 ==========
function renderTM14(page, ctx) {
  const id = ctx.contextId || getContextId();
  const task = id ? get(ObjectTypes.TASK, id) : null;

  if (!task) {
    return heading(page.title, page.subtitle, [page.module, page.title])
      + emptyState('请选择已完成任务进行归档', 'archive');
  }

  const session = getSession();
  const canArchive = ['技术负责人', '质量负责人'].includes(session.role);
  const canDoStatus = task.status === '已完成';

  return heading(page.title, page.subtitle, [page.module, '任务', task.code])
    + panel('任务信息', kvList(
      [{ key: 'code', label: '任务编号' }, { key: 'testItems', label: '检测项目' }, { key: 'executor', label: '执行人' }, { key: 'reviewer', label: '复核人' }, { key: 'status', label: '当前状态' }],
      task,
    ))
    + alert('info', '任务完成后归档，交接报告编制。归档后任务进入报告编制队列。')
    + (canDoStatus && canArchive
      ? `<div class="form-actions">
          ${button('确认归档', 'tm14-archive', 'primary', 'archive')}
          ${button('进入报告编制', 'tm14-goto-report', 'brand', 'file-text')}
        </div>`
      : !canDoStatus
        ? alert('info', `任务当前状态：${task.status}，仅"已完成"状态可归档`)
        : alert('warning', `当前角色"${session.role}"无权归档`));
}

// ====================================================================
// 页面级动作处理
// ====================================================================
document.addEventListener('cnas:action', (event) => {
  const { action, el } = event.detail;
  const contextId = el?.getAttribute('data-context-id') || getContextId();
  const session = getSession();

  switch (action) {
    // ===== TM01 =====
    case 'tm01-refresh':
      go('TM01');
      break;

    // ===== TM02 排程 =====
    case 'tm02-schedule': {
      const item = get(ObjectTypes.TASK, contextId);
      const fields = {};
      document.querySelectorAll('[data-schedule-field]').forEach((f) => { fields[f.dataset.scheduleField] = f.value.trim(); });
      if (!fields.executor) { toast('请填写执行人', '', 'warning'); return; }
      if (!fields.reviewer) { toast('请填写复核人', '', 'warning'); return; }
      if (fields.executor === fields.reviewer) { toast('职责分离校验失败', '执行人与复核人禁止相同 [RULE: 职责分离]', 'danger'); return; }
      update(ObjectTypes.TASK, contextId, { executor: fields.executor, reviewer: fields.reviewer, plannedDate: fields.plannedDate, resourceValid: '待校验' });
      const result = execute(ObjectTypes.TASK, 'schedule', { objectId: contextId, role: session.role, item: get(ObjectTypes.TASK, contextId) });
      handleResult(result, '任务已排程', 'TM01');
      break;
    }

    // ===== TM03 详情动作 =====
    case 'tm03-execute': {
      const executeAction = el?.getAttribute('data-execute-action');
      const item = get(ObjectTypes.TASK, contextId);
      const result = execute(ObjectTypes.TASK, executeAction, { objectId: contextId, role: session.role, item });
      handleResult(result, '操作成功', 'TM03');
      break;
    }

    // ===== TM04 开工 =====
    case 'tm04-start': {
      const item = get(ObjectTypes.TASK, contextId);
      const result = execute(ObjectTypes.TASK, 'start', { objectId: contextId, role: session.role, item });
      handleResult(result, '任务已开工', 'TM03');
      break;
    }

    // ===== TM05 原始记录 =====
    case 'tm05-save': {
      const fields = {};
      document.querySelectorAll('[data-record-field]').forEach((f) => { fields[f.dataset.recordField] = f.value.trim(); });
      const task = get(ObjectTypes.TASK, contextId);
      const data = getData();
      let record = data.records.find((r) => r.taskCode === task.code && r.status !== '已锁定');
      if (record) {
        update(ObjectTypes.RECORD, record.id, { data: fields.data, calculatedResult: fields.result });
      } else {
        record = create(ObjectTypes.RECORD, {
          taskCode: task.code,
          version: 'V1',
          data: fields.data,
          calculatedResult: fields.result,
          recordedBy: session.role,
        });
      }
      toast('记录已保存', '', 'success');
      break;
    }
    case 'tm05-submit': {
      const item = get(ObjectTypes.TASK, contextId);
      // 计算异常影响：未处理异常阻断提交 [FR-RECORD-005]
      const impact = computeTaskImpact(item);
      const result = execute(ObjectTypes.TASK, 'submit-review', { objectId: contextId, role: session.role, item, impact });
      handleResult(result, '已提交复核', 'TM01');
      break;
    }
    case 'tm05-goto-instrument':
      updateSession({ currentContextId: contextId });
      go('TM06');
      break;
    case 'tm05-goto-exception':
      updateSession({ currentContextId: contextId });
      go('TM09');
      break;

    // ===== TM06 仪器导入 =====
    case 'tm06-import': {
      const fields = {};
      document.querySelectorAll('[data-instrument-field]').forEach((f) => { fields[f.dataset.instrumentField] = f.value.trim(); });
      toast('模拟导入完成', `仪器：${fields.instrumentId || '未知'}，文件：${fields.file || '未知'}`, 'success');
      go('TM05');
      break;
    }

    // ===== TM07 数据计算 =====
    case 'tm07-calculate': {
      const output = document.querySelector('[data-calc-field="output"]');
      if (output) output.value = '计算完成 - 示例结果（演示数据）';
      toast('计算完成', '', 'success');
      break;
    }

    // ===== TM08 资源核验 =====
    case 'tm08-update': {
      const overall = document.querySelector('[data-verify-field="overall"]')?.value;
      update(ObjectTypes.TASK, contextId, { resourceValid: overall || '待校验' });
      toast('核验结果已更新', `综合结论：${overall}`, 'success');
      go('TM04');
      break;
    }

    // ===== TM09 异常 =====
    case 'tm09-confirm': {
      const item = get(ObjectTypes.TASK, contextId);
      const type = document.querySelector('[data-exception-field="type"]')?.value;
      if (!type) { toast('请选择异常类型', '', 'warning'); return; }
      update(ObjectTypes.TASK, contextId, { exceptionFlag: type });
      const result = execute(ObjectTypes.TASK, 'exception', { objectId: contextId, role: session.role, item: get(ObjectTypes.TASK, contextId) });
      handleResult(result, '异常已记录', 'TM03');
      break;
    }
    case 'tm09-recover': {
      const item = get(ObjectTypes.TASK, contextId);
      const result = execute(ObjectTypes.TASK, 'recover', { objectId: contextId, role: session.role, item });
      if (result.ok) {
        // 恢复执行时清空异常标识，使异常真正关闭（否则后续提交复核会被 hasUnclosedException 阻断）
        update(ObjectTypes.TASK, contextId, { exceptionFlag: '' });
      }
      handleResult(result, '任务已恢复执行', 'TM05');
      break;
    }
    case 'tm09-goto-recheck':
      updateSession({ currentContextId: contextId });
      go('TM10');
      break;

    // ===== TM10 复检 =====
    case 'tm10-approve': {
      const reason = document.querySelector('[data-recheck-field="reason"]')?.value.trim();
      if (!reason) { toast('请填写复检原因', '', 'warning'); return; }
      toast('复检已批准', '已生成关联任务（演示）', 'success');
      go('TM02');
      break;
    }

    // ===== TM12 复核 =====
    case 'tm12-pass': {
      const item = get(ObjectTypes.TASK, contextId);
      // 计算异常影响：异常处置未完成不得通过 [FR-RECORD-005]
      const impact = computeTaskImpact(item);
      const result = execute(ObjectTypes.TASK, 'review-pass', { objectId: contextId, role: session.role, item, impact });
      if (result.ok) {
        // 联动更新关联原始记录状态：待复核 -> 已复核
        cascadeRecordStatus(item.code, '已复核');
      }
      handleResult(result, '复核通过', 'TM01');
      break;
    }
    case 'tm12-return': {
      const item = get(ObjectTypes.TASK, contextId);
      const result = execute(ObjectTypes.TASK, 'review-return', { objectId: contextId, role: session.role, item });
      if (result.ok) {
        // 联动更新关联原始记录状态：待复核 -> 已退回
        cascadeRecordStatus(item.code, '已退回');
      }
      handleResult(result, '已退回补充', 'TM01');
      break;
    }

    // ===== TM13 质控放行 =====
    case 'tm13-release': {
      toast('质控放行完成', '结果已放行，可进入完成归档', 'success');
      go('TM14');
      break;
    }

    // ===== TM14 归档 =====
    case 'tm14-archive': {
      toast('任务已归档', '可进入报告编制', 'success');
      break;
    }
    case 'tm14-goto-report':
      updateSession({ currentContextId: contextId });
      go('RM01');
      break;

    default:
      break;
  }
});

// ===== 辅助函数 =====
// 计算任务异常影响：存在未关闭异常阻断提交/复核 [FR-RECORD-005]
function computeTaskImpact(task) {
  // exceptionFlag 非空表示异常未关闭（recover 时应清空）
  const hasUnclosedException = !!task.exceptionFlag;
  return { hasUnclosedException };
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

// 任务复核联动：更新该任务下所有待复核/已退回的原始记录状态
function cascadeRecordStatus(taskCode, newStatus) {
  const data = getData();
  const records = data.records.filter((r) => r.taskCode === taskCode && ['待复核', '已退回'].includes(r.status));
  records.forEach((r) => {
    update(ObjectTypes.RECORD, r.id, { status: newStatus, reviewedBy: getSession().role });
  });
}
