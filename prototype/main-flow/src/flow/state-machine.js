// 集中式状态机：状态字典 + 转换表
// 每个状态转换登记：{ from[], to, action, preconditions[], forbidden[], auditEvent, nextStatus }
// 所有页面共享，新增流转只需加一条规则。

import { ObjectTypes } from '../data/schema.js';
import { changeStatus } from '../data/repository.js';
import { getSession } from '../state/store.js';

// 权限角色定义
export const ROLES = {
  RECEIVER: '业务受理人员',
  TECH_LEAD: '技术负责人',
  QUALITY: '质量负责人',
  SAMPLE_ADMIN: '样品管理员',
  TESTER: '检测员',
  REVIEWER: '复核人',
  AUTH_SIGNER: '授权签字人',
};

// 转换规则表
// objectType + actionId 唯一定位一条规则
// from: 允许的起始状态列表（空数组=任意状态）
// to: 目标状态
// preconditions: 前置条件函数列表 [(ctx) => {pass, reason}]
// forbidden: 禁止条件说明文本（阻断时展示）
// roles: 允许操作的角色列表
export const Transitions = [
  // ===== 委托 (COMMISSION) =====
  {
    objectType: ObjectTypes.COMMISSION, action: 'submit-review',
    from: ['草稿'], to: '待评审',
    roles: [ROLES.RECEIVER, ROLES.TECH_LEAD],
    label: '提交合同评审',
    preconditions: [(ctx) => {
      const item = ctx.item;
      if (!item.type) return { pass: false, reason: '委托类型不能为空' };
      if (!item.requirements) return { pass: false, reason: '委托要求不能为空' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.COMMISSION, action: 'approve',
    from: ['待评审'], to: '评审通过',
    roles: [ROLES.TECH_LEAD, ROLES.QUALITY],
    label: '通过受理',
    preconditions: [(ctx) => {
      // 职责分离校验：审批人不能是委托登记人（统一用 ctx.role，与角色校验一致）
      const actingRole = ctx.role || getSession().role;
      if (ctx.item.owner === actingRole) return { pass: false, reason: '审批人与登记人职责分离校验未通过' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.COMMISSION, action: 'conditional-approve',
    from: ['待评审'], to: '评审通过',
    roles: [ROLES.TECH_LEAD, ROLES.QUALITY],
    label: '附条件受理',
  },
  {
    objectType: ObjectTypes.COMMISSION, action: 'reject',
    from: ['待评审'], to: '已拒绝',
    roles: [ROLES.TECH_LEAD, ROLES.QUALITY],
    label: '退回补充',
  },
  {
    objectType: ObjectTypes.COMMISSION, action: 'confirm',
    from: ['评审通过'], to: '已受理',
    roles: [ROLES.RECEIVER],
    label: '客户确认生效',
    preconditions: [(ctx) => {
      if (!ctx.item.contractVersion) return { pass: false, reason: '客户确认凭证（合同版本）缺失，不得进入执行 [FR-CONTRACT-004]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.COMMISSION, action: 'change',
    from: ['已受理', '评审通过'], to: '已变更',
    roles: [ROLES.RECEIVER, ROLES.TECH_LEAD],
    label: '发起变更',
    preconditions: [(ctx) => {
      // 已发布结果不得随委托覆盖 [FR-CONTRACT-005]
      if (ctx.impact?.hasPublishedReport) return { pass: false, reason: '存在已发布报告，必须完成影响评价后才可生效 [FR-CONTRACT-005]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.COMMISSION, action: 'revoke',
    from: ['草稿', '待评审', '评审通过'], to: '已撤销',
    roles: [ROLES.RECEIVER, ROLES.TECH_LEAD],
    label: '撤销委托',
  },

  // ===== 样品 (SAMPLE) =====
  {
    objectType: ObjectTypes.SAMPLE, action: 'receive',
    from: ['待接收'], to: '已接收',
    roles: [ROLES.SAMPLE_ADMIN],
    label: '确认接收',
    preconditions: [(ctx) => {
      if (!ctx.item.packageStatus) return { pass: false, reason: '包装状态不能为空' };
      if (!ctx.item.transportCondition) return { pass: false, reason: '运输条件不能为空' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'exception',
    from: ['待接收', '已接收'], to: '隔离中',
    roles: [ROLES.SAMPLE_ADMIN, ROLES.TECH_LEAD],
    label: '发起异常',
    forbidden: '隔离中样品不得进入检测 [FR-SAMPLE-002]',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'conditional-receive',
    from: ['隔离中'], to: '已接收',
    roles: [ROLES.SAMPLE_ADMIN, ROLES.TECH_LEAD],
    label: '有条件接收',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'label',
    from: ['已接收'], to: '已接收',
    roles: [ROLES.SAMPLE_ADMIN],
    label: '生成标签',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'aliquot',
    from: ['已接收'], to: '已分样',
    roles: [ROLES.SAMPLE_ADMIN],
    label: '分样',
    preconditions: [(ctx) => {
      if (!ctx.item.quantity) return { pass: false, reason: '数量不足，无法分样 [FR-SAMPLE-004]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'handover',
    from: ['已接收', '已分样'], to: '已交接',
    roles: [ROLES.SAMPLE_ADMIN, ROLES.TESTER],
    label: '样品交接',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'checkout',
    from: ['已交接'], to: '已领用',
    roles: [ROLES.TESTER],
    label: '领用',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'return',
    from: ['已领用'], to: '已归还',
    roles: [ROLES.TESTER, ROLES.SAMPLE_ADMIN],
    label: '归还',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'retain',
    from: ['已归还', '已领用'], to: '留样中',
    roles: [ROLES.SAMPLE_ADMIN],
    label: '留样',
  },
  {
    objectType: ObjectTypes.SAMPLE, action: 'dispose',
    from: ['留样中', '已归还'], to: '已处置',
    roles: [ROLES.SAMPLE_ADMIN, ROLES.QUALITY],
    label: '处置',
    preconditions: [(ctx) => {
      // 法律冻结、投诉或未完成任务禁止销毁 [FR-SAMPLE-005]
      if (ctx.impact?.hasLegalHold) return { pass: false, reason: '样品被法律冻结，禁止销毁 [FR-SAMPLE-005]' };
      if (ctx.impact?.hasPendingTask) return { pass: false, reason: '存在未完成任务，禁止销毁 [FR-SAMPLE-005]' };
      return { pass: true };
    }],
  },

  // ===== 检测任务 (TASK) =====
  {
    objectType: ObjectTypes.TASK, action: 'schedule',
    from: ['待排程'], to: '待开工',
    roles: [ROLES.TECH_LEAD],
    label: '排程',
    preconditions: [(ctx) => {
      if (!ctx.item.executor) return { pass: false, reason: '执行人不能为空' };
      if (!ctx.item.reviewer) return { pass: false, reason: '复核人不能为空' };
      if (ctx.item.executor === ctx.item.reviewer) return { pass: false, reason: '执行人与复核人禁止相同 [RULE: 职责分离]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.TASK, action: 'start',
    from: ['待开工', '已退回'], to: '执行中',
    roles: [ROLES.TESTER, ROLES.TECH_LEAD],
    label: '确认开工',
    preconditions: [(ctx) => {
      // 开工前须确认人员授权、样品、方法、设备、物料和环境均满足 [FR-TASK-002]
      if (ctx.item.resourceValid === '阻断') return { pass: false, reason: '资源校验未通过，已阻断 [FR-TASK-002/RULE-008]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.TASK, action: 'exception',
    from: ['执行中'], to: '异常暂停',
    roles: [ROLES.TESTER, ROLES.TECH_LEAD],
    label: '记录异常',
  },
  {
    objectType: ObjectTypes.TASK, action: 'recover',
    from: ['异常暂停'], to: '执行中',
    roles: [ROLES.TESTER, ROLES.TECH_LEAD],
    label: '恢复执行',
  },
  {
    objectType: ObjectTypes.TASK, action: 'submit-review',
    from: ['执行中'], to: '待复核',
    roles: [ROLES.TESTER],
    label: '提交复核',
    preconditions: [(ctx) => {
      // 缺失结果或未处理异常应阻断提交 [FR-RECORD-005]
      if (ctx.impact?.hasUnclosedException) return { pass: false, reason: '存在未处理异常，阻断提交 [FR-RECORD-005]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.TASK, action: 'review-pass',
    from: ['待复核'], to: '已完成',
    // 复核人角色不可选时，技术负责人兜底复核（与 TM12 UI canReview 对齐）
    roles: [ROLES.REVIEWER, ROLES.TECH_LEAD],
    label: '复核通过',
    preconditions: [(ctx) => {
      // 复核人冲突校验
      if (ctx.item.reviewer === ctx.item.executor) return { pass: false, reason: '复核人与执行人禁止相同 [RULE: 职责分离]' };
      // 异常未关闭不得通过
      if (ctx.impact?.hasUnclosedException) return { pass: false, reason: '异常处置未完成，不得通过 [FR-RECORD-005]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.TASK, action: 'review-return',
    from: ['待复核'], to: '已退回',
    roles: [ROLES.REVIEWER, ROLES.TECH_LEAD],
    label: '退回补充',
  },

  // ===== 原始记录 (RECORD) =====
  {
    objectType: ObjectTypes.RECORD, action: 'submit-review',
    from: ['草稿', '已退回'], to: '待复核',
    roles: [ROLES.TESTER],
    label: '提交复核',
  },
  {
    objectType: ObjectTypes.RECORD, action: 'review-pass',
    from: ['待复核'], to: '已复核',
    // 复核人角色不可选时，技术负责人兜底复核（与 TM12 UI 联动对齐）
    roles: [ROLES.REVIEWER, ROLES.TECH_LEAD],
    label: '复核通过',
    preconditions: [(ctx) => {
      // 职责分离校验：记录人与复核人禁止相同（统一用 ctx.role，与角色校验一致）
      const actingRole = ctx.role || getSession().role;
      if (ctx.item.recordedBy === actingRole) return { pass: false, reason: '记录人与复核人禁止相同 [RULE: 职责分离]' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.RECORD, action: 'review-return',
    from: ['待复核'], to: '已退回',
    roles: [ROLES.REVIEWER, ROLES.TECH_LEAD],
    label: '退回补充',
  },
  {
    objectType: ObjectTypes.RECORD, action: 'lock',
    from: ['已复核'], to: '已锁定',
    roles: [ROLES.REVIEWER, ROLES.TECH_LEAD, ROLES.QUALITY],
    label: '锁定记录',
    forbidden: '已锁定记录禁止物理覆盖 [RULE-003]',
  },
  {
    objectType: ObjectTypes.RECORD, action: 'correct',
    from: ['已复核', '已锁定'], to: '草稿',
    roles: [ROLES.TESTER, ROLES.QUALITY],
    label: '更正',
    preconditions: [(ctx) => {
      // 已发布结果受影响时触发报告更正 [FR-RECORD-004]
      return { pass: true, warning: '更正保留旧值、原因和签名；如影响已发布结果，将触发报告更正或召回流程 [FR-RECORD-004]' };
    }],
  },

  // ===== 报告 (REPORT) =====
  {
    objectType: ObjectTypes.REPORT, action: 'submit-review',
    from: ['草稿', '审核退回'], to: '待审核',
    roles: [ROLES.TESTER, ROLES.RECEIVER],
    label: '提交审核',
    preconditions: [(ctx) => {
      // 缺页、缺项、数据冲突或无效附件必须阻断提交 [FR-REPORT-001]
      if (!ctx.item.author) return { pass: false, reason: '编制人不能为空' };
      if (!ctx.item.type) return { pass: false, reason: '报告类型不能为空' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.REPORT, action: 'review-pass',
    from: ['待审核'], to: '待签发',
    roles: [ROLES.REVIEWER, ROLES.QUALITY],
    label: '审核通过',
    preconditions: [(ctx) => {
      // 审核不得绕过结果复核和完整性检查
      if (!ctx.item.reviewer) return { pass: false, reason: '审核人不能为空' };
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.REPORT, action: 'review-return',
    from: ['待审核'], to: '审核退回',
    roles: [ROLES.REVIEWER, ROLES.QUALITY],
    label: '审核退回',
  },
  {
    objectType: ObjectTypes.REPORT, action: 'sign',
    from: ['待签发'], to: '已签发',
    roles: [ROLES.AUTH_SIGNER],
    label: '授权签发',
    preconditions: [(ctx) => {
      // 仅授权范围有效的签字人可批准报告 [RULE-010/FR-REPORT-004]
      if (!ctx.item.signer) return { pass: false, reason: '授权签字人不能为空 [RULE-010]' };
      return { pass: true, warning: '电子签名绑定签名人/目的/版本/摘要/时间 [TBD-010 待确认签名方式]' };
    }],
  },
  {
    objectType: ObjectTypes.REPORT, action: 'sign-return',
    from: ['待签发'], to: '签发退回',
    roles: [ROLES.AUTH_SIGNER],
    label: '签发退回',
  },
  {
    objectType: ObjectTypes.REPORT, action: 'publish',
    from: ['已签发'], to: '已发布',
    roles: [ROLES.AUTH_SIGNER, ROLES.RECEIVER],
    label: '发布报告',
    preconditions: [(ctx) => {
      // 报告只能发布已签发版本 [FR-REPORT-005]
      return { pass: true };
    }],
  },
  {
    objectType: ObjectTypes.REPORT, action: 'publish-fail',
    from: ['已签发'], to: '发布失败',
    roles: [ROLES.RECEIVER],
    label: '发布失败',
  },
  {
    objectType: ObjectTypes.REPORT, action: 'retry-publish',
    from: ['发布失败'], to: '已发布',
    roles: [ROLES.RECEIVER, ROLES.AUTH_SIGNER],
    label: '重试发布',
  },
  {
    objectType: ObjectTypes.REPORT, action: 'correct',
    from: ['已发布'], to: '已更正',
    roles: [ROLES.AUTH_SIGNER, ROLES.QUALITY],
    label: '发起更正',
    forbidden: '原版不得删除；更正生成新版本并重新履行审核与签发 [FR-REPORT-006]',
  },
  {
    objectType: ObjectTypes.REPORT, action: 'withdraw',
    from: ['已发布'], to: '已召回',
    roles: [ROLES.AUTH_SIGNER, ROLES.QUALITY],
    label: '撤回/作废',
    forbidden: '撤回停止有效交付，原版转已召回；不得删除原报告 [FR-REPORT-006]',
  },
  {
    objectType: ObjectTypes.REPORT, action: 'archive',
    from: ['已发布', '已更正'], to: '已归档',
    roles: [ROLES.QUALITY],
    label: '归档',
  },
];

// 执行状态转换：校验 -> 执行 -> 返回结果
// 返回 { ok, reason, warning, item }
export function execute(objectType, action, context) {
  const rule = Transitions.find(
    (t) => t.objectType === objectType && t.action === action,
  );
  if (!rule) {
    return { ok: false, reason: `未定义的动作: ${action}` };
  }

  const item = context.item;
  if (!item) {
    return { ok: false, reason: '未找到业务对象' };
  }

  // 状态校验
  if (rule.from.length > 0 && !rule.from.includes(item.status)) {
    return { ok: false, reason: `当前状态 "${item.status}" 不允许此操作，要求状态: ${rule.from.join('/')}` };
  }

  // 角色校验（优先用 context.role，回退到 session）
  const currentRole = context.role || getSession().role;
  if (rule.roles && rule.roles.length > 0 && !rule.roles.includes(currentRole)) {
    return {
      ok: false,
      reason: `当前角色 "${currentRole}" 无权操作，要求角色: ${rule.roles.join('/')}`,
      permissionDenied: true,
    };
  }

  // 前置条件校验
  if (rule.preconditions) {
    for (const check of rule.preconditions) {
      const result = check(context);
      if (!result.pass) {
        return { ok: false, reason: result.reason };
      }
    }
  }

  // 执行状态变更
  const updated = changeStatus(objectType, item.id, rule.to, rule.label);

  return {
    ok: true,
    item: updated,
    warning: rule.preconditions?.reduce((w, check) => {
      const r = check(context);
      return r.warning ? (w ? `${w}; ${r.warning}` : r.warning) : w;
    }, null),
    label: rule.label,
    forbidden: rule.forbidden,
  };
}

// 查询某对象在当前状态下可用的动作列表（按角色和前置条件过滤）
// role 可选：不传时用当前会话角色；传 'ANY' 表示不过滤角色（用于展示全部可选动作）
export function availableActions(objectType, item, options = {}) {
  if (!item) return [];
  const role = options.role === 'ANY' ? null : (options.role || getSession().role);
  const skipPreconditions = options.skipPreconditions === true;
  return Transitions.filter(
    (t) => {
      if (t.objectType !== objectType) return false;
      if (t.from.length > 0 && !t.from.includes(item.status)) return false;
      // 按角色过滤
      if (role && t.roles && t.roles.length > 0 && !t.roles.includes(role)) return false;
      // 按前置条件过滤（可跳过，用于需要区分"可见但禁用"的场景）
      if (!skipPreconditions && t.preconditions) {
        for (const check of t.preconditions) {
          const r = check({ item, role, impact: options.impact });
          if (!r.pass) return false;
        }
      }
      return true;
    },
  );
}

// 查询某动作是否可用（用于按钮禁用判断）
export function canExecute(objectType, action, context) {
  const rule = Transitions.find(
    (t) => t.objectType === objectType && t.action === action,
  );
  if (!rule) return { ok: false, reason: '未定义动作' };
  // 空 from 数组表示任意状态允许（与 execute 一致）
  if (rule.from.length > 0 && !rule.from.includes(context.item.status)) return { ok: false, reason: `状态 ${context.item.status} 不允许` };
  const currentRole = context.role || getSession().role;
  if (rule.roles && !rule.roles.includes(currentRole)) return { ok: false, reason: '角色无权限' };
  if (rule.preconditions) {
    for (const check of rule.preconditions) {
      const r = check(context);
      if (!r.pass) return { ok: false, reason: r.reason };
    }
  }
  return { ok: true };
}
