// 页面规格注册表
// 每页含 id/title/module/kind/fields/flowMeta/actionContracts。
// 从规格文件提取关键字段。按批次逐步追加：批次1含工作台+CC，后续追加SM/TM/RM。

export const Pages = {
  // ===== 工作台 =====
  WB02: { id: 'WB02', module: '工作台', title: '综合工作台', kind: 'dashboard', subtitle: '集中查看业务、质量和资源指标，及时处理逾期任务与风险预警',
    fields: ['待办数量', '委托进度', '样品状态', '检测任务', '报告时效', '质量风险', '资源预警'] },
  WB03: { id: 'WB03', module: '工作台', title: '我的待办', kind: 'todoList', subtitle: '按类型、优先级和到期时间查看待处理事项',
    fields: ['待办编号', '待办类型', '业务来源', '业务摘要', '优先级', '发起人', '到期时间', '处理状态'] },
  AUDIT: { id: 'AUDIT', module: '审计', title: '审计轨迹', kind: 'audit', subtitle: '查看本地操作审计记录，演示原型仅保留最近100条',
    fields: ['时间', '操作人', '动作', '详情'] },

  // ===== P01 客户与委托受理 =====
  CC01: { id: 'CC01', module: '客户与委托', title: '客户台账', kind: 'list', subtitle: '查看客户档案、合作状态与保密等级',
    objectType: 'customer', fields: ['客户编号', '客户名称', '客户类型', '联系人', '联系方式', '信用状态', '保密等级', '合作状态'] },
  CC02: { id: 'CC02', module: '客户与委托', title: '客户档案', kind: 'detail', subtitle: '维护客户主体信息、联系人、资质与委托历史',
    objectType: 'customer', fields: ['客户编号', '客户名称', '客户类型', '联系人', '联系方式', '信用状态', '保密等级', '合作状态', '创建时间'] },
  CC03: { id: 'CC03', module: '客户与委托', title: '委托列表', kind: 'list', subtitle: '跟踪委托登记、评审、确认、受理和变更进度',
    objectType: 'commission', fields: ['委托编号', '客户名称', '委托类型', '样品数量', '期望日期', '评审进度', '责任人', '委托状态'] },
  CC04: { id: 'CC04', module: '客户与委托', title: '新建委托向导', kind: 'wizard', subtitle: '分步登记客户要求、样品概况、检测项目与方法要求',
    objectType: 'commission', fields: ['客户信息', '委托要求', '样品概况', '检测项目', '方法要求', '判定规则', '交付要求', '特殊约定'] },
  CC05: { id: 'CC05', module: '客户与委托', title: '委托详情', kind: 'detail', subtitle: '查看委托基本信息、评审结论及样品/任务/报告进度链路',
    objectType: 'commission', fields: ['委托编号', '客户名称', '委托类型', '样品数量', '期望日期', '评审结论', '合同版本', '责任人', '委托状态', '委托要求'] },
  CC06: { id: 'CC06', module: '客户与委托', title: '报价与合同', kind: 'form', subtitle: '登记计费项目、报价、合同条款与客户确认',
    objectType: 'commission', fields: ['报价编号', '计费项目', '数量', '单价', '税率', '合同条款', '付款条件', '有效期', '客户确认'] },
  CC07: { id: 'CC07', module: '客户与委托', title: '合同评审', kind: 'approval', subtitle: '评审能力范围、方法适用性、资源与交付周期，输出评审结论',
    objectType: 'commission', fields: ['能力范围', '方法适用性', '人员授权', '设备资源', '环境条件', '交付周期', '分包安排', '判定规则', '评审结论'] },
  CC08: { id: 'CC08', module: '客户与委托', title: '委托变更评审', kind: 'approval', subtitle: '分析变更影响，完成影响评价后生效新版本',
    objectType: 'commission', fields: ['原委托版本', '变更来源', '变更内容', '影响样品', '影响任务', '影响报告', '补充评审', '客户确认', '变更结论'] },
  CC09: { id: 'CC09', module: '客户与委托', title: '客户沟通与满意度', kind: 'list', subtitle: '记录客户沟通、反馈与跟进事项',
    objectType: 'customer', fields: ['客户', '沟通类型', '关联委托', '沟通渠道', '沟通内容', '责任人', '反馈结果', '跟进状态'] },

  // ===== P02 样品生命周期 =====
  SM01: { id: 'SM01', module: '样品管理', title: '待接收样品', kind: 'list', subtitle: '查看待接收样品列表，进入接收工作台完成接收',
    objectType: 'sample', fields: ['样品编号', '样品名称', '委托编号', '数量', '运输条件', '状态'] },
  SM02: { id: 'SM02', module: '样品管理', title: '样品接收工作台', kind: 'form', subtitle: '登记包装状态、运输条件和接收结论，完成样品接收',
    objectType: 'sample', fields: ['样品编号', '样品名称', '包装状态', '运输条件', '接收结论', '接收人', '接收时间'] },
  SM03: { id: 'SM03', module: '样品管理', title: '异常确认', kind: 'approval', subtitle: '确认样品异常并决定隔离或有条件接收',
    objectType: 'sample', fields: ['样品编号', '异常类型', '异常描述', '处理结论', '处理人'] },
  SM04: { id: 'SM04', module: '样品管理', title: '样品台账', kind: 'list', subtitle: '查看全部样品的状态、位置和流转记录',
    objectType: 'sample', fields: ['样品编号', '样品名称', '委托编号', '数量', '存储位置', '状态', '留样期限'] },
  SM05: { id: 'SM05', module: '样品管理', title: '样品追踪详情', kind: 'detail', subtitle: '查看样品完整生命周期：接收、标签、分样、交接、领用、留样、处置',
    objectType: 'sample', fields: ['样品编号', '样品名称', '委托编号', '数量', '包装状态', '运输条件', '接收结论', '存储位置', '留样期限', '状态'] },
  SM06: { id: 'SM06', module: '样品管理', title: '样品标签', kind: 'form', subtitle: '生成或补打样品标签，记录标签信息',
    objectType: 'sample', fields: ['样品编号', '样品名称', '标签编号', '标签内容', '打印状态'] },
  SM07: { id: 'SM07', module: '样品管理', title: '分样', kind: 'form', subtitle: '将样品拆分为子样品，记录分样信息',
    objectType: 'sample', fields: ['原样编号', '子样编号', '分样数量', '分样人', '分样时间'] },
  SM08: { id: 'SM08', module: '样品管理', title: '样品交接', kind: 'form', subtitle: '完成样品从样品管理员到检测员的交接',
    objectType: 'sample', fields: ['样品编号', '交出人', '接收人', '交接时间', '交接确认'] },
  SM09: { id: 'SM09', module: '样品管理', title: '样品存储', kind: 'form', subtitle: '登记或更新样品存储位置和环境条件',
    objectType: 'sample', fields: ['样品编号', '存储位置', '环境条件', '存入时间', '取出时间'] },
  SM10: { id: 'SM10', module: '样品管理', title: '领用与归还', kind: 'form', subtitle: '检测员领用样品用于检测，检测完成后归还',
    objectType: 'sample', fields: ['样品编号', '领用人', '领用时间', '归还时间', '领用状态'] },
  SM11: { id: 'SM11', module: '样品管理', title: '留样管理', kind: 'list', subtitle: '管理留样样品的期限、延期和处置',
    objectType: 'sample', fields: ['样品编号', '样品名称', '留样期限', '存储位置', '留样状态'] },
  SM12: { id: 'SM12', module: '样品管理', title: '样品处置', kind: 'approval', subtitle: '对到期留样进行处置，需确认无法律冻结和未完成任务',
    objectType: 'sample', fields: ['样品编号', '处置方式', '处置原因', '处置人', '见证人', '处置时间'] },

  // ===== P03 检测执行与结果放行 =====
  TM01: { id: 'TM01', module: '检测管理', title: '检测任务列表', kind: 'list', subtitle: '查看全部检测任务的状态和进度',
    objectType: 'task', fields: ['任务编号', '委托编号', '样品编号', '检测项目', '执行人', '复核人', '状态', '计划时间'] },
  TM02: { id: 'TM02', module: '检测管理', title: '任务排程', kind: 'form', subtitle: '分配执行人、复核人，确认资源后排程开工',
    objectType: 'task', fields: ['任务编号', '执行人', '复核人', '计划时间', '资源校验', '排程结论'] },
  TM03: { id: 'TM03', module: '检测管理', title: '任务详情', kind: 'detail', subtitle: '查看任务完整信息、原始记录和结果链路',
    objectType: 'task', fields: ['任务编号', '委托编号', '样品编号', '检测项目', '方法', '执行人', '复核人', '资源校验', '进度', '状态'] },
  TM04: { id: 'TM04', module: '检测管理', title: '任务开工', kind: 'form', subtitle: '确认资源核验通过后开工执行',
    objectType: 'task', fields: ['任务编号', '资源核验', '开工确认', '开工时间'] },
  TM05: { id: 'TM05', module: '检测管理', title: '原始记录', kind: 'form', subtitle: '登记检测原始数据、计算结果',
    objectType: 'record', fields: ['记录编号', '任务编号', '测量数据', '计算结果', '记录人', '版本'] },
  TM06: { id: 'TM06', module: '检测管理', title: '仪器数据导入', kind: 'form', subtitle: '从仪器导入原始数据文件',
    objectType: 'record', fields: ['仪器编号', '数据文件', '导入时间', '导入人'] },
  TM07: { id: 'TM07', module: '检测管理', title: '数据计算', kind: 'form', subtitle: '根据原始数据计算检测结果',
    objectType: 'record', fields: ['计算公式', '输入数据', '计算结果', '不确定度', '计算人'] },
  TM08: { id: 'TM08', module: '检测管理', title: '资源核验', kind: 'form', subtitle: '核验人员授权、设备、方法、环境是否满足',
    objectType: 'task', fields: ['人员授权', '设备校准', '方法有效性', '环境条件', '物料', '核验结论'] },
  TM09: { id: 'TM09', module: '检测管理', title: '异常处理', kind: 'approval', subtitle: '记录检测异常，决定恢复、复检或重测',
    objectType: 'task', fields: ['异常类型', '异常描述', '处理结论', '处理人'] },
  TM10: { id: 'TM10', module: '检测管理', title: '复检/重测', kind: 'approval', subtitle: '批准复检或重测，生成关联任务',
    objectType: 'task', fields: ['原任务', '复检原因', '复检范围', '批准人', '新任务编号'] },
  TM11: { id: 'TM11', module: '检测管理', title: '结果汇总', kind: 'detail', subtitle: '汇总任务所有检测结果和原始记录',
    objectType: 'task', fields: ['任务编号', '检测项目', '结果列表', '判定结论', '汇总人'] },
  TM12: { id: 'TM12', module: '检测管理', title: '结果复核', kind: 'approval', subtitle: '复核人审核原始记录和结果，通过或退回',
    objectType: 'record', fields: ['记录编号', '复核人', '复核结论', '复核意见'] },
  TM13: { id: 'TM13', module: '检测管理', title: '质控放行', kind: 'approval', subtitle: '质量控制人员确认质控数据满足后放行结果',
    objectType: 'task', fields: ['质控样品', '质控结果', '判异规则', '放行结论', '放行人'] },
  TM14: { id: 'TM14', module: '检测管理', title: '完成归档', kind: 'approval', subtitle: '任务完成归档，交接报告编制',
    objectType: 'task', fields: ['任务编号', '完成时间', '归档确认', '交接报告'] },

  // ===== P04 报告编制、发布与归档 =====
  RM01: { id: 'RM01', module: '报告管理', title: '报告队列', kind: 'list', subtitle: '查看报告编制、审核、签发和发布进度',
    objectType: 'report', fields: ['报告编号', '委托编号', '客户名称', '报告类型', '编制人', '审核人', '签发人', '状态', '交付期限'] },
  RM02: { id: 'RM02', module: '报告管理', title: '报告编制', kind: 'form', subtitle: '编制报告内容，关联原始记录和检测结果',
    objectType: 'report', fields: ['报告编号', '报告类型', '编制人', '编制内容', '关联任务', '认可标识'] },
  RM03: { id: 'RM03', module: '报告管理', title: '预览检查', kind: 'detail', subtitle: '检查报告完整性、数据一致性和格式规范性',
    objectType: 'report', fields: ['完整性检查', '数据一致性', '格式规范', '附件检查', '检查结论'] },
  RM04: { id: 'RM04', module: '报告管理', title: '报告审核', kind: 'approval', subtitle: '审核报告内容，通过或退回补充',
    objectType: 'report', fields: ['报告编号', '审核人', '审核意见', '审核结论'] },
  RM05: { id: 'RM05', module: '报告管理', title: '授权签发', kind: 'approval', subtitle: '授权签字人签发报告，绑定电子签名',
    objectType: 'report', fields: ['报告编号', '签发人', '授权范围', '签名方式', '签发结论'] },
  RM06: { id: 'RM06', module: '报告管理', title: '认可标识核验', kind: 'approval', subtitle: '核验报告认可标识使用是否正确',
    objectType: 'report', fields: ['认可标识', '认可范围', '超范围项', '核验结论'] },
  RM07: { id: 'RM07', module: '报告管理', title: '报告发布', kind: 'form', subtitle: '发布报告到指定交付渠道',
    objectType: 'report', fields: ['报告编号', '交付渠道', '接收人', '发布时间', '发布状态'] },
  RM08: { id: 'RM08', module: '报告管理', title: '报告详情与版本', kind: 'detail', subtitle: '查看报告详情、版本历史和交付状态',
    objectType: 'report', fields: ['报告编号', '版本', '编制人', '审核人', '签发人', '状态', '交付渠道', '交付期限'] },
  RM09: { id: 'RM09', module: '报告管理', title: '报告更正', kind: 'form', subtitle: '发起报告更正，生成新版本重新审核签发',
    objectType: 'report', fields: ['原报告', '更正原因', '更正内容', '新版本号', '影响评价'] },
  RM10: { id: 'RM10', module: '报告管理', title: '报告撤回/作废', kind: 'approval', subtitle: '撤回或作废已发布报告，停止有效交付',
    objectType: 'report', fields: ['报告编号', '撤回原因', '影响范围', '批准人', '通知客户'] },
  RM11: { id: 'RM11', module: '报告管理', title: '报告归档', kind: 'list', subtitle: '查看已归档报告，受控调阅',
    objectType: 'report', fields: ['报告编号', '归档时间', '归档人', '版本', '调阅记录'] },
};

// 根据页面 ID 获取页面规格
export function getPage(pageId) {
  return Pages[pageId] || null;
}

// 获取所有页面 ID
export function getAllPageIds() {
  return Object.keys(Pages);
}
