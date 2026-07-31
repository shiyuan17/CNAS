// 业务对象类型定义（schema）
// 每类对象定义字段列表、状态枚举、默认值。字段标注 required/enum/options。
// [待确认] 项标注 TBD，原型按默认阻断策略实现。

export const ObjectTypes = {
  CUSTOMER: 'customer',
  COMMISSION: 'commission',
  SAMPLE: 'sample',
  TASK: 'task',
  RECORD: 'record',
  REPORT: 'report',
};

// 状态枚举（集中定义，供状态机引用）
export const StatusEnum = {
  // 客户
  CUSTOMER: ['活跃', '暂停', '停用'],
  // 委托
  COMMISSION: ['草稿', '待评审', '评审通过', '已受理', '已变更', '已撤销', '已拒绝'],
  // 样品
  SAMPLE: ['待接收', '隔离中', '已接收', '已分样', '已交接', '已领用', '已归还', '留样中', '已处置'],
  // 检测任务
  TASK: ['待排程', '待开工', '执行中', '异常暂停', '待复核', '已完成', '已退回'],
  // 原始记录
  RECORD: ['草稿', '待复核', '已复核', '已退回', '已锁定'],
  // 报告
  REPORT: ['草稿', '待审核', '审核退回', '待签发', '签发退回', '已签发', '发布失败', '已发布', '已召回', '已更正', '已归档'],
};

// 字段定义模板：{ key, label, required, enum, placeholder, hint }
export const Schemas = {
  [ObjectTypes.CUSTOMER]: {
    label: '客户',
    idPrefix: 'CUS',
    fields: [
      { key: 'code', label: '客户编号', required: true },
      { key: 'name', label: '客户名称', required: true },
      { key: 'type', label: '客户类型', enum: ['企业', '政府机构', '个人', '其他'] },
      { key: 'contact', label: '联系人' },
      { key: 'phone', label: '联系方式' },
      { key: 'creditStatus', label: '信用状态', enum: ['正常', '关注', '异常'] },
      { key: 'confidentiality', label: '保密等级', enum: ['公开', '内部', '机密'] },
      { key: 'cooperationStatus', label: '合作状态', enum: ['活跃', '暂停', '停用'] },
    ],
    statusField: 'cooperationStatus',
  },

  [ObjectTypes.COMMISSION]: {
    label: '委托',
    idPrefix: 'COMM',
    fields: [
      { key: 'code', label: '委托编号', required: true },
      { key: 'customerName', label: '客户名称', required: true },
      { key: 'customerId', label: '客户ID' },
      { key: 'type', label: '委托类型', enum: ['检测', '校准'], required: true },
      { key: 'sampleCount', label: '样品数量' },
      { key: 'expectedDate', label: '期望日期' },
      { key: 'reviewProgress', label: '评审进度' },
      { key: 'owner', label: '责任人' },
      { key: 'requirements', label: '委托要求', hint: '检测项目、方法要求、判定规则、交付要求、特殊约定' },
      { key: 'quotationAmount', label: '报价金额' },
      { key: 'contractVersion', label: '合同版本' },
      { key: 'reviewConclusion', label: '评审结论', enum: ['通过', '附条件', '退回', '待评审'] },
    ],
    statusField: 'status',
  },

  [ObjectTypes.SAMPLE]: {
    label: '样品',
    idPrefix: 'SMP',
    fields: [
      { key: 'code', label: '样品编号', required: true },
      { key: 'name', label: '样品名称', required: true },
      { key: 'commissionCode', label: '委托编号' },
      { key: 'quantity', label: '样品数量' },
      { key: 'packageStatus', label: '包装状态', enum: ['完好', '轻微破损', '严重破损'] },
      { key: 'transportCondition', label: '运输条件' },
      { key: 'receivedAt', label: '接收时间' },
      { key: 'receivedBy', label: '接收人' },
      { key: 'receiveConclusion', label: '接收结论', enum: ['正常接收', '有条件接收', '拒收'] },
      { key: 'location', label: '存储位置' },
      { key: 'parentId', label: '父样品编号', hint: '分样时记录原样编号' },
      { key: 'retentionDeadline', label: '留样期限' },
    ],
    statusField: 'status',
  },

  [ObjectTypes.TASK]: {
    label: '检测任务',
    idPrefix: 'TASK',
    fields: [
      { key: 'code', label: '任务编号', required: true },
      { key: 'commissionCode', label: '委托编号' },
      { key: 'sampleCode', label: '样品编号' },
      { key: 'testItems', label: '检测项目' },
      { key: 'method', label: '检测方法' },
      { key: 'plannedDate', label: '计划时间' },
      { key: 'executor', label: '执行人' },
      { key: 'reviewer', label: '复核人', hint: '禁止与执行人相同 [RULE: 职责分离]' },
      { key: 'progress', label: '任务进度' },
      { key: 'resourceValid', label: '资源校验', enum: ['通过', '阻断', '待校验'] },
      { key: 'exceptionFlag', label: '异常标识' },
    ],
    statusField: 'status',
  },

  [ObjectTypes.RECORD]: {
    label: '原始记录',
    idPrefix: 'REC',
    fields: [
      { key: 'code', label: '记录编号', required: true },
      { key: 'taskCode', label: '任务编号' },
      { key: 'version', label: '版本', hint: '更正生成新版本，禁止物理覆盖 [RULE-003]' },
      { key: 'data', label: '测量数据' },
      { key: 'calculatedResult', label: '计算结果' },
      { key: 'recordedBy', label: '记录人' },
      { key: 'reviewedBy', label: '复核人' },
      { key: 'correctionReason', label: '更正原因', hint: '已发布结果受影响时触发报告更正 [FR-RECORD-004]' },
    ],
    statusField: 'status',
  },

  [ObjectTypes.REPORT]: {
    label: '报告',
    idPrefix: 'RPT',
    fields: [
      { key: 'code', label: '报告编号', required: true },
      { key: 'commissionCode', label: '委托编号' },
      { key: 'customerName', label: '客户名称' },
      { key: 'type', label: '报告类型', enum: ['检测报告', '校准证书'] },
      { key: 'author', label: '编制人' },
      { key: 'reviewer', label: '审核人' },
      { key: 'signer', label: '授权签字人', hint: '需授权范围有效 [RULE-010]' },
      { key: 'version', label: '报告版本', hint: '更正/撤回生成新版本，原版不得删除 [FR-REPORT-006]' },
      { key: 'deliveryDeadline', label: '交付期限' },
      { key: 'accreditationScope', label: '认可标识', enum: ['认可', '非认可', '分包'], hint: '超范围不得误用认可标识 [FR-REPORT-002]' },
      { key: 'deliveryChannel', label: '交付渠道', enum: ['邮件', '快递', '自取', '平台下载'] },
    ],
    statusField: 'status',
  },
};

// 生成下一个编号（格式与种子数据一致：PREFIX-YYYY-NNNN）
export function nextCode(objectType, existing) {
  const schema = Schemas[objectType];
  if (!schema) return '';
  const prefix = schema.idPrefix;
  const year = new Date().getFullYear();
  const nums = existing
    .map((item) => {
      const m = String(item.code || '').match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}
