const page = (
  id,
  title,
  role,
  kind,
  goal,
  fields,
  menu,
  pageType,
  entry,
  back,
  flow,
  requirement,
) => ({
  id,
  title,
  role,
  kind,
  goal,
  fields,
  menu,
  pageType,
  entry,
  back,
  flow,
  requirement,
});

const resourcePages = [
  page(
    'R01',
    '人员档案',
    '人员管理员 / 技术负责人',
    'listDrawer',
    '集中维护人员身份、岗位、资格和任职经历',
    ['人员编号', '姓名', '岗位', '专业组', '入职日期', '在岗状态'],
    '人员管理',
    '入口页',
    '资源管理 > 人员',
    '资源管理',
    ['查询人员', '查看档案', '维护经历', '提交复核'],
    'ISO/IEC 17025:2017 6.2.2、6.2.5；人员资格与记录要求',
  ),
  page(
    'R02',
    '人员资质与经历',
    '人员管理员 / 技术负责人',
    'detail',
    '记录学历、资格、工作经历和持续任职条件',
    ['人员', '资格类型', '证书编号', '有效期', '工作经历', '复核状态'],
    '人员管理',
    '操作页',
    '人员档案 > 资质与经历',
    '人员档案',
    ['登记资格', '上传证明', '技术复核', '到期提醒'],
    'ISO/IEC 17025:2017 6.2.2、6.2.5；能力证明可追溯要求',
  ),
  page(
    'R03',
    '培训计划',
    '培训管理员 / 部门负责人',
    'schedule',
    '按岗位能力差距制定年度和专项培训计划',
    ['计划编号', '培训主题', '适用岗位', '计划日期', '负责人', '计划状态'],
    '培训管理',
    '入口页',
    '资源管理 > 培训',
    '资源管理',
    ['识别需求', '制定计划', '审批发布', '通知参训人'],
    'ISO/IEC 17025:2017 6.2.5；培训需求、实施和记录要求',
  ),
  page(
    'R04',
    '培训执行与考核',
    '培训管理员 / 考核人员 / 参训人员',
    'detail',
    '完成签到、学习、考核和培训有效性评价',
    ['培训主题', '参训人员', '签到状态', '考核成绩', '评价结论', '完成状态'],
    '培训管理',
    '操作页',
    '培训计划 > 执行与考核',
    '培训计划',
    ['组织培训', '签到学习', '实施考核', '评价有效性', '归档记录'],
    'ISO/IEC 17025:2017 6.2.5；培训实施与有效性评价要求',
  ),
  page(
    'R05',
    '人员能力评价',
    '技术负责人 / 能力评价人员',
    'review',
    '依据项目、方法、设备和场所证据评价人员能力',
    ['人员', '评价项目', '评价方式', '证据', '评价结论', '复评日期'],
    '能力授权',
    '入口页',
    '资源管理 > 能力授权',
    '资源管理',
    ['发起评价', '收集证据', '实施评价', '形成结论', '进入授权'],
    'ISO/IEC 17025:2017 6.2.3、6.2.5；人员能力监控要求',
  ),
  page(
    'R06',
    '能力授权矩阵',
    '技术负责人 / 授权管理员',
    'matrix',
    '维护人员在项目、方法、设备和场所维度的技术授权',
    ['人员', '检测项目', '方法版本', '设备', '授权场所', '授权状态'],
    '能力授权',
    '操作页',
    '人员能力评价 > 授权',
    '人员能力评价',
    ['选择评价结论', '定义授权范围', '批准授权', '定期复评', '暂停或撤销'],
    'ISO/IEC 17025:2017 6.2.6；人员授权及授权记录要求',
  ),
  page(
    'R07',
    '方法标准台账',
    '技术负责人 / 标准管理员',
    'listDrawer',
    '管理标准方法、自建方法及其适用范围和有效版本',
    ['方法编号', '方法名称', '标准号', '版本', '适用范围', '受控状态'],
    '方法标准',
    '入口页',
    '资源管理 > 方法标准',
    '资源管理',
    ['登记方法', '关联标准', '技术审核', '受控发布'],
    'ISO/IEC 17025:2017 7.2.1；方法选择和有效版本要求',
  ),
  page(
    'R08',
    '标准查新与版本',
    '标准管理员 / 技术负责人',
    'version',
    '跟踪标准更新并评价版本变化对业务的影响',
    ['标准号', '现行版本', '替代版本', '查新日期', '影响范围', '处置状态'],
    '方法标准',
    '操作页',
    '方法标准台账 > 查新与版本',
    '方法标准台账',
    ['执行查新', '识别变化', '影响评价', '更新方法', '通知相关人员'],
    'ISO/IEC 17025:2017 7.2.1.3；方法保持最新有效的要求',
  ),
  page(
    'R09',
    '方法验证与确认',
    '技术负责人 / 检测人员',
    'form',
    '策划并记录方法验证、确认、评价和批准过程',
    ['项目编号', '方法版本', '验证类型', '技术指标', '评价结论', '审批状态'],
    '方法标准',
    '操作页',
    '方法标准台账 > 验证与确认',
    '方法标准台账',
    ['制定方案', '实施试验', '汇总数据', '技术评价', '批准使用'],
    'ISO/IEC 17025:2017 7.2.1.5、7.2.2；方法验证和确认要求',
  ),
  page(
    'R10',
    '测量不确定度与判定规则',
    '技术负责人 / 结果审核人员',
    'version',
    '维护不确定度模型和结果判定规则的受控版本',
    ['模型名称', '适用项目', '主要分量', '判定规则', '版本', '发布状态'],
    '方法标准',
    '操作页',
    '方法标准台账 > 不确定度与判定规则',
    '方法标准台账',
    ['建立模型', '评定分量', '验证计算', '批准发布', '应用复核'],
    'ISO/IEC 17025:2017 7.6、7.8.6；不确定度和符合性声明要求',
  ),
  page(
    'R11',
    '设备台账',
    '设备管理员 / 使用人员',
    'listDrawer',
    '管理设备标识、位置、状态、证书和生命周期记录',
    ['设备编号', '设备名称', '型号规格', '所在位置', '责任人', '设备状态'],
    '设备管理',
    '入口页',
    '资源管理 > 设备',
    '资源管理',
    ['设备登记', '验收建档', '投入使用', '状态维护', '停用或报废'],
    'ISO/IEC 17025:2017 6.4.3、6.4.13；设备标识和记录要求',
  ),
  page(
    'R12',
    '设备校准与核查计划',
    '设备管理员 / 计量管理员',
    'schedule',
    '统一安排校准、检定、期间核查和维护活动',
    ['计划类型', '设备', '计划日期', '执行机构', '责任人', '完成状态'],
    '设备管理',
    '操作页',
    '设备台账 > 校准与核查计划',
    '设备台账',
    ['制定计划', '审批计划', '执行活动', '确认结果', '更新设备状态'],
    'ISO/IEC 17025:2017 6.4.6、6.4.7、6.4.10；校准和期间核查要求',
  ),
  page(
    'R13',
    '设备使用维护记录',
    '设备管理员 / 使用人员',
    'detail',
    '记录设备使用、维护、维修和状态检查全过程',
    ['设备', '记录类型', '使用任务', '发生时间', '执行人', '结果状态'],
    '设备管理',
    '操作页',
    '设备台账 > 使用维护记录',
    '设备台账',
    ['使用前检查', '记录使用', '执行维护或维修', '状态确认', '归档记录'],
    'ISO/IEC 17025:2017 6.4.3、6.4.9、6.4.13；设备使用和维护要求',
  ),
  page(
    'R14',
    '设备异常与影响评价',
    '设备管理员 / 技术负责人 / 质量负责人',
    'exception',
    '处置设备故障、失准和验收不合格并评价结果影响',
    ['设备', '异常类型', '影响时段', '关联任务', '处置措施', '评价结论'],
    '设备管理',
    '操作页',
    '设备台账 > 异常与影响评价',
    '设备台账',
    ['停用标识', '登记异常', '识别受影响工作', '技术评价', '处置并恢复'],
    'ISO/IEC 17025:2017 6.4.9；不正常设备隔离及影响评价要求',
  ),
  page(
    'R15',
    '物料与批次库存',
    '物料管理员 / 使用人员',
    'listDrawer',
    '管理标准物质、试剂和耗材的品种、批次与库存',
    ['物料编码', '物料名称', '批次', '库存量', '有效期', '库存状态'],
    '物料管理',
    '入口页',
    '资源管理 > 物料',
    '资源管理',
    ['建立主数据', '登记批次', '入库存放', '领用消耗', '盘点调整'],
    'ISO/IEC 17025:2017 6.4、6.5；影响结果的物品和计量溯源要求',
  ),
  page(
    'R16',
    '入库验证与领用',
    '物料管理员 / 领用人员',
    'receive',
    '完成批次验收、入库、领用、退库和使用追溯',
    ['物料', '批次', '验收项目', '数量', '库位', '经办人'],
    '物料管理',
    '操作页',
    '物料与批次库存 > 入库验证与领用',
    '物料与批次库存',
    ['到货核对', '质量验证', '确认入库', '扫码领用', '关联检测任务'],
    'ISO/IEC 17025:2017 6.4.1、6.5；资源适用性和溯源要求',
  ),
  page(
    'R17',
    '库存预警与召回',
    '物料管理员 / 采购人员 / 质量负责人',
    'monitor',
    '处理库存不足、临期、过期和批次召回风险',
    ['预警类型', '物料', '批次', '当前库存', '有效期', '处置状态'],
    '物料管理',
    '操作页',
    '物料与批次库存 > 预警与召回',
    '物料与批次库存',
    ['生成预警', '确认风险', '冻结批次', '补货或召回', '评价使用影响'],
    'ISO/IEC 17025:2017 6.4.1、7.10；资源有效性和不符合工作控制要求',
  ),
  page(
    'R18',
    '设施环境监控',
    '设施管理员 / 质量负责人',
    'monitor',
    '监控区域、设施和环境条件的实时值与趋势',
    ['监测点', '区域', '温度', '湿度', '控制限', '在线状态'],
    '环境设施',
    '入口页',
    '资源管理 > 环境',
    '资源管理',
    ['配置监测点', '采集数据', '趋势监控', '阈值判断', '记录环境条件'],
    'ISO/IEC 17025:2017 6.3；设施和环境条件监控要求',
  ),
  page(
    'R19',
    '环境异常与影响评价',
    '设施管理员 / 技术负责人 / 质量负责人',
    'exception',
    '确认环境失控、恢复条件并评价关联检测工作',
    ['报警点位', '异常时段', '最大偏差', '关联任务', '恢复状态', '评价结论'],
    '环境设施',
    '操作页',
    '设施环境监控 > 异常与影响评价',
    '设施环境监控',
    ['确认报警', '控制现场', '识别关联任务', '影响评价', '验证恢复'],
    'ISO/IEC 17025:2017 6.3.4、7.10；环境失控处置要求',
  ),
  page(
    'R20',
    '供应商准入',
    '采购人员 / 技术负责人 / 质量负责人',
    'review',
    '评价外部提供方资质、能力和服务适用性',
    ['供应商', '服务类别', '资质证书', '能力范围', '准入结论', '有效状态'],
    '供应商',
    '入口页',
    '资源管理 > 供应商',
    '资源管理',
    ['提交申请', '资料审查', '能力评价', '批准准入', '列入名录'],
    'ISO/IEC 17025:2017 6.6.2；外部提供方评价与选择要求',
  ),
  page(
    'R21',
    '供应商绩效评价',
    '采购人员 / 使用部门 / 质量负责人',
    'listDrawer',
    '按交付、质量和服务表现实施定期再评价',
    ['供应商', '评价周期', '交付评分', '质量评分', '服务评分', '评价结论'],
    '供应商',
    '操作页',
    '供应商准入 > 绩效评价',
    '供应商准入',
    ['汇总履约记录', '部门评分', '质量复核', '形成结论', '维持或退出'],
    'ISO/IEC 17025:2017 6.6.2；外部提供方监控和再评价要求',
  ),
  page(
    'R22',
    '采购申请与审批',
    '申请人员 / 采购人员 / 审批人员',
    'form',
    '提出采购需求并确认技术、质量和预算要求',
    ['申请编号', '采购对象', '技术要求', '需求日期', '预算', '审批状态'],
    '采购管理',
    '入口页',
    '资源管理 > 采购',
    '资源管理',
    ['提出需求', '技术确认', '预算审批', '选择供应商', '形成订单'],
    'ISO/IEC 17025:2017 6.6.1、6.6.3；采购要求沟通与批准要求',
  ),
  page(
    'R23',
    '采购订单与到货跟踪',
    '采购人员 / 申请部门',
    'listDrawer',
    '跟踪采购订单、交付计划、到货和偏差处理',
    ['订单编号', '供应商', '采购对象', '承诺日期', '到货进度', '订单状态'],
    '采购管理',
    '操作页',
    '采购申请与审批 > 订单跟踪',
    '采购申请与审批',
    ['下达订单', '跟踪交付', '登记到货', '处理偏差', '移交验收'],
    'ISO/IEC 17025:2017 6.6.3；外部提供产品和服务要求传递',
  ),
  page(
    'R24',
    '采购验收与服务评价',
    '采购人员 / 验收人员 / 使用部门',
    'receive',
    '依据采购要求验收物品或服务并记录评价结果',
    ['订单编号', '验收对象', '验收项目', '验收结果', '偏差处置', '评价状态'],
    '采购管理',
    '操作页',
    '采购订单与到货跟踪 > 验收',
    '采购订单与到货跟踪',
    ['核对订单', '执行验收', '登记偏差', '确认接收', '反馈供应商绩效'],
    'ISO/IEC 17025:2017 6.6.2；外部提供产品和服务符合性确认',
  ),
  page(
    'R25',
    '分包评审与客户同意',
    '技术负责人 / 业务人员 / 质量负责人',
    'review',
    '评审分包必要性、承包方能力和客户同意条件',
    ['评审编号', '委托项目', '分包方', '能力范围', '客户同意', '评审结论'],
    '分包管理',
    '入口页',
    '资源管理 > 分包',
    '资源管理',
    ['提出分包', '能力评审', '确认责任', '取得客户同意', '批准执行'],
    'ISO/IEC 17025:2017 6.6、7.1.1；外部实验室和客户沟通要求',
  ),
  page(
    'R26',
    '分包执行与结果验收',
    '分包管理员 / 技术负责人 / 结果审核人员',
    'detail',
    '跟踪分包样品、进度、结果接收和最终报告引用',
    ['分包任务', '分包方', '样品', '交付日期', '结果验收', '引用状态'],
    '分包管理',
    '操作页',
    '分包评审与客户同意 > 执行',
    '分包评审与客户同意',
    ['下达分包任务', '交接样品', '跟踪执行', '验收结果', '纳入报告'],
    'ISO/IEC 17025:2017 6.6、7.8.2；外部结果控制和报告标识要求',
  ),
  page(
    'M06',
    '移动设备与物料扫码',
    '设备管理员 / 物料管理员 / 使用人员',
    'mobileScan',
    '扫码查看设备或物料状态并完成现场操作',
    ['扫码结果', '对象摘要', '当前状态', '快捷动作', '异常照片'],
    '设备管理',
    '操作页',
    '移动工作台 > 扫码',
    '移动工作台',
    ['扫描标识', '核验状态', '执行巡检或领用', '提交异常', '同步记录'],
    'ISO/IEC 17025:2017 6.4、6.5；设备和物料现场追溯要求',
  ),
];

const qualityPages = [
  page(
    'Q01',
    '质量控制计划',
    '质量负责人 / 技术负责人',
    'schedule',
    '按项目风险制定内部质量控制方案和实施频次',
    ['计划编号', '检测项目', '质控方式', '实施频次', '责任人', '计划状态'],
    '质量控制',
    '入口页',
    '质量管理 > 质量控制',
    '质量管理',
    ['风险分析', '制定计划', '技术审批', '发布执行', '定期复核'],
    'ISO/IEC 17025:2017 7.7.1；确保结果有效性的监控要求',
  ),
  page(
    'Q02',
    '质控结果与趋势',
    '质量负责人 / 检测人员',
    'qualityChart',
    '汇总质控结果、趋势和规则判定并识别偏移',
    ['检测项目', '质控批次', '结果', '统计参数', '规则判定', '结果状态'],
    '质量控制',
    '操作页',
    '质量控制计划 > 结果与趋势',
    '质量控制计划',
    ['采集结果', '统计计算', '规则判定', '趋势复核', '结果放行'],
    'ISO/IEC 17025:2017 7.7.1、7.7.3；质量监控数据分析要求',
  ),
  page(
    'Q03',
    '质控失控调查',
    '质量负责人 / 技术负责人 / 检测人员',
    'exception',
    '调查质控失控原因并控制相关检测结果',
    ['调查编号', '失控规则', '影响批次', '原因分析', '处置措施', '恢复结论'],
    '质量控制',
    '操作页',
    '质控结果与趋势 > 失控调查',
    '质控结果与趋势',
    ['触发失控', '暂停相关工作', '调查原因', '评价影响', '验证恢复'],
    'ISO/IEC 17025:2017 7.7.3、7.10；失控数据处置要求',
  ),
  page(
    'Q04',
    '能力验证年度计划',
    '质量负责人 / 技术负责人',
    'schedule',
    '基于能力范围和风险制定能力验证及实验室间比对计划',
    ['计划年度', '领域项目', '活动类型', '组织方', '计划时间', '计划状态'],
    '能力验证',
    '入口页',
    '质量管理 > 能力验证',
    '质量管理',
    ['分析覆盖需求', '选择活动', '制定计划', '批准计划', '跟踪实施'],
    'ISO/IEC 17025:2017 7.7.2；能力验证参与和结果监控要求',
  ),
  page(
    'Q05',
    '能力验证实施与评价',
    '质量负责人 / 技术负责人 / 检测人员',
    'detail',
    '管理报名、实施、结果接收、技术评价和不满意处置',
    ['项目编号', '组织方', '实施阶段', '结果指标', '评价结论', '处置状态'],
    '能力验证',
    '操作页',
    '能力验证年度计划 > 实施与评价',
    '能力验证年度计划',
    ['报名确认', '样品实施', '提交结果', '接收报告', '技术评价', '处置归档'],
    'ISO/IEC 17025:2017 7.7.2；能力验证结果评价和后续措施要求',
  ),
  page(
    'Q06',
    '质量事件中心',
    '质量负责人 / 责任部门',
    'listDrawer',
    '统一受理投诉、不符合、偏离和质量异常来源',
    ['事件编号', '事件来源', '事件类型', '严重度', '责任部门', '事件状态'],
    '质量事件',
    '入口页',
    '质量管理 > 质量事件',
    '质量管理',
    ['登记事件', '初步分级', '分配责任', '启动调查', '转入处置'],
    'ISO/IEC 17025:2017 7.9、7.10；投诉和不符合工作控制要求',
  ),
  page(
    'Q07',
    '投诉与申诉处理',
    '质量负责人 / 客户服务人员 / 调查人员',
    'review',
    '记录投诉申诉、独立调查、回复和处理结论',
    ['投诉编号', '客户', '受理日期', '调查人员', '处理结论', '回复状态'],
    '质量事件',
    '操作页',
    '质量事件中心 > 投诉与申诉',
    '质量事件中心',
    ['接收投诉', '确认受理', '独立调查', '审核结论', '正式回复', '关闭记录'],
    'ISO/IEC 17025:2017 7.9；投诉过程、独立性和回复要求',
  ),
  page(
    'Q08',
    '不符合工作控制',
    '质量负责人 / 技术负责人 / 责任部门',
    'exception',
    '控制不符合工作并完成严重度、影响和可接受性评价',
    ['事件编号', '不符合描述', '严重度', '影响对象', '控制措施', '处置决定'],
    '质量事件',
    '操作页',
    '质量事件中心 > 不符合工作',
    '质量事件中心',
    ['识别不符合', '立即控制', '影响评价', '决定处置', '通知相关方', '恢复工作'],
    'ISO/IEC 17025:2017 7.10；不符合工作控制和结果影响要求',
  ),
  page(
    'Q09',
    'CAPA 计划与执行',
    '质量负责人 / 措施责任人',
    'capa',
    '基于根因制定并跟踪纠正预防措施',
    ['CAPA编号', '来源事件', '根本原因', '措施', '责任人', '截止日期'],
    'CAPA',
    '入口页',
    '质量管理 > CAPA',
    '质量管理',
    ['确认问题', '根因分析', '制定措施', '审批计划', '执行并提交证据'],
    'ISO/IEC 17025:2017 8.7；原因分析和纠正措施要求',
  ),
  page(
    'Q10',
    'CAPA 有效性验证',
    '质量负责人 / 独立验证人员',
    'review',
    '独立验证措施实施结果、持续有效性和关闭条件',
    ['CAPA编号', '验证方案', '验证证据', '验证人员', '验证结论', '关闭状态'],
    'CAPA',
    '操作页',
    'CAPA 计划与执行 > 有效性验证',
    'CAPA 计划与执行',
    ['提交验证', '核对证据', '评价有效性', '退回补充或通过', '批准关闭'],
    'ISO/IEC 17025:2017 8.7.3；纠正措施有效性评审要求',
  ),
  page(
    'Q11',
    '风险与机遇台账',
    '质量负责人 / 部门负责人',
    'listDrawer',
    '统一登记业务、技术和管理体系风险与改进机遇',
    ['风险编号', '来源', '风险描述', '责任部门', '风险等级', '应对状态'],
    '风险管理',
    '入口页',
    '质量管理 > 风险',
    '质量管理',
    ['识别风险或机遇', '登记责任', '初步评价', '制定应对', '持续监控'],
    'ISO/IEC 17025:2017 8.5、8.6；风险机遇和改进要求',
  ),
  page(
    'Q12',
    '风险评价与措施跟踪',
    '质量负责人 / 风险责任人 / 验证人员',
    'matrix',
    '评价风险等级并跟踪应对措施和剩余风险',
    ['风险编号', '可能性', '影响程度', '风险等级', '应对措施', '剩余风险'],
    '风险管理',
    '操作页',
    '风险与机遇台账 > 评价与措施',
    '风险与机遇台账',
    ['分析风险', '确定等级', '批准措施', '执行跟踪', '评价剩余风险', '关闭或升级'],
    'ISO/IEC 17025:2017 8.5；风险应对措施与有效性评价要求',
  ),
];

// Keep entry ledgers and monitoring views on their existing renderers. Pages that
// drive a controlled action use a specialised family selected by the generator.
const renderFamilies = {
  R02: 'verification',
  R03: 'workflow',
  R04: 'workflow',
  R05: 'approval',
  R06: 'approval',
  R08: 'lifecycle',
  R09: 'verification',
  R10: 'lifecycle',
  R12: 'workflow',
  R13: 'workflow',
  R14: 'verification',
  R16: 'workflow',
  R17: 'workflow',
  R19: 'verification',
  R20: 'approval',
  R21: 'approval',
  R22: 'workflow',
  R23: 'workflow',
  R24: 'verification',
  R25: 'approval',
  R26: 'workflow',
  M06: 'workflow',
  Q01: 'workflow',
  Q02: 'verification',
  Q03: 'verification',
  Q04: 'workflow',
  Q05: 'verification',
  Q07: 'approval',
  Q08: 'workflow',
  Q09: 'workflow',
  Q10: 'approval',
  Q12: 'approval',
};

const mergeProfileSections = (...profiles) => profiles.reduce((result, profile) => {
  if (!profile) return result;
  const next = { ...result, ...profile };
  for (const section of ['edit', 'detail', 'modal', 'blocker', 'success', 'flow', 'audit']) {
    if (profile[section]) next[section] = { ...(result[section] || {}), ...profile[section] };
  }
  return next;
}, {});

const interactionProfileBase = (item) => ({
  edit: {
    enabled: true,
    mode: ['version', 'lifecycle'].includes(item.renderFamily) ? 'version' : 'form-or-drawer',
    fields: item.fields.slice(0, 4),
    validation: ['必填项完整', '当前业务状态允许操作', '关联资源、证据与影响范围可追溯'],
    actions: ['保存草稿', '提交复核'],
  },
  detail: {
    enabled: true,
    mode: 'detail-drawer',
    sections: ['基础信息', '关联业务', '当前状态与影响'],
    entry: '查看详情与历史记录',
  },
  modal: {
    enabled: true,
    variant: 'standard',
    title: '确认提交当前变更',
    action: '确认提交',
    content: '提交前请确认影响范围、处置依据与后续节点；未确定的规则沿用[待确认]口径。',
  },
  blocker: {
    enabled: true,
    state: 'blocked',
    reasons: ['当前账号无流程权限', '关键字段或证据缺失', '关联资源状态不满足'],
    action: '保存草稿或返回处理',
  },
  success: {
    enabled: true,
    tone: 'success',
    title: '操作成功',
    message: '变更已保存，流程节点与审计记录已更新。',
  },
  flow: {
    enabled: true,
    steps: item.flow.slice(0, 5),
    currentStep: 1,
    pending: item.flow.at(-1) || '等待下一节点',
  },
  audit: {
    enabled: true,
    events: ['打开页面 · 记录访问', '保存草稿 · 记录变更', '提交操作 · 等待下一节点'],
    actor: '当前用户',
  },
});

const interactionProfilePresets = {
  personnel: {
    edit: {
      mode: 'personnel-form',
      validation: ['人员身份、岗位和在岗状态完整', '资格、培训与能力评价关联可追溯', '复核证据已上传且状态有效'],
      actions: ['保存档案草稿', '提交技术复核'],
    },
    detail: {
      sections: ['身份与岗位', '资格、培训与能力授权', '任职与复核历史'],
      entry: '打开人员详情与资质抽屉',
    },
    modal: {
      title: '确认提交人员资质与授权变更',
      action: '提交技术复核',
      content: '提交后进入技术复核；资格有效期、培训要求和授权条件按候选规格执行，未定事项标记为[待确认]。',
    },
    blocker: {
      reasons: ['人员档案必填信息未完成', '培训、能力评价或授权证据缺失', '资格已过期或授权状态已暂停'],
      action: '补充证据或返回人员档案',
    },
    success: {
      title: '人员变更已提交',
      message: '人员档案、资格记录和待复核节点已更新，后续动作保留审计留痕。',
    },
    audit: {
      events: ['打开人员档案 · 记录访问', '更新资格/培训/授权 · 记录变更', '提交技术复核 · 等待复核'],
    },
  },
  training: {
    edit: {
      mode: 'training-plan-form',
      validation: ['培训需求与岗位能力差距已关联', '负责人、参训范围和记录字段完整', '考核结果与有效性评价可追溯'],
      actions: ['保存培训草稿', '提交审批发布'],
    },
    detail: {
      sections: ['培训计划与参训范围', '签到、学习与考核记录', '有效性评价与归档'],
      entry: '查看培训执行详情',
    },
    modal: {
      title: '确认发布培训计划',
      action: '确认审批发布',
      content: '发布后通知参训人员并保留签到、考核和有效性评价记录；计划频次或阈值未确定时显示[待确认]。',
    },
    blocker: {
      reasons: ['岗位能力差距或参训范围未确认', '培训记录或考核证据缺失', '有效性评价未完成，不能形成授权依据'],
      action: '补充培训记录或返回计划',
    },
    success: {
      title: '培训流程已更新',
      message: '计划发布或考核结果已保存，参训通知和归档审计记录已生成。',
    },
  },
  method: {
    edit: {
      mode: 'controlled-version-form',
      validation: ['方法来源、适用范围和版本号完整', '标准查新与技术审核结论已记录', '验证数据、判定规则与影响评价可追溯'],
      actions: ['保存版本草稿', '提交受控发布'],
    },
    detail: {
      sections: ['方法与标准来源', '版本变化与影响评价', '验证证据、适用范围与发布历史'],
      entry: '打开方法版本与变更抽屉',
    },
    modal: {
      variant: 'warning',
      title: '确认发布方法版本变更',
      action: '确认受控发布',
      content: '发布前必须完成技术审核、影响评价和必要验证；版本启用范围与替代规则未定事项标记为[待确认]。',
    },
    blocker: {
      reasons: ['方法版本未完成技术审核', '标准查新影响未评价或验证证据缺失', '关联设备、人员授权或适用范围不满足'],
      action: '补充评价证据或返回版本草稿',
    },
    success: {
      title: '方法版本已进入受控流程',
      message: '版本变更、影响评价和发布待办已记录，旧版本使用范围保留可追溯记录。',
    },
    audit: {
      events: ['打开方法版本 · 记录访问', '完成查新/验证/影响评价 · 记录证据', '受控发布或退回 · 记录版本状态'],
    },
  },
  equipment: {
    edit: {
      mode: 'equipment-status-form',
      validation: ['设备身份、校准/核查状态完整', '停用影响范围与关联任务已识别', '恢复前的维修、校准或核查证据可追溯'],
      actions: ['保存异常草稿', '提交停用/恢复复核'],
    },
    detail: {
      sections: ['设备台账与校准状态', '使用、维护与异常记录', '关联任务与影响评价'],
      entry: '打开设备状态与影响详情',
    },
    modal: {
      variant: 'warning',
      title: '确认变更设备状态',
      action: '确认停用/恢复',
      content: '停用需确认现场标识和受影响工作；恢复需完成必要处置及独立核查，具体条件沿用[待确认]口径。',
    },
    blocker: {
      reasons: ['设备校准、核查或维修状态不满足', '受影响任务未完成识别与处置', '恢复验证或技术复核证据缺失'],
      action: '补充影响评价或返回设备处置',
    },
    success: {
      title: '设备状态变更已记录',
      message: '设备停用、恢复或异常处置已更新，关联任务和审计轨迹保持可追溯。',
    },
    audit: {
      events: ['登记设备异常/状态变更 · 记录原因', '完成影响评价 · 记录关联任务', '停用或恢复复核 · 记录处理人'],
    },
  },
  materials: {
    edit: {
      mode: 'batch-inventory-form',
      validation: ['物料、批次、数量和有效期完整', '临期/过期状态已识别并完成影响评价', '入库、领用、冻结或召回记录可追溯'],
      actions: ['保存批次草稿', '提交冻结/召回复核'],
    },
    detail: {
      sections: ['物料批次与库存', '有效期、质量验证与存放', '领用、关联任务与召回历史'],
      entry: '打开物料批次详情抽屉',
    },
    modal: {
      variant: 'warning',
      title: '确认冻结或召回物料批次',
      action: '确认状态变更',
      content: '临期或过期批次需先完成影响评价并通知相关使用方；具体临期阈值沿用候选规格并标记为[待确认]。',
    },
    blocker: {
      reasons: ['批次质量验证或有效期信息缺失', '临期/过期影响评价未完成', '关联检测任务或领用记录未处置'],
      action: '补充批次证据或返回库存处理',
    },
    success: {
      title: '物料批次状态已更新',
      message: '入库、领用、冻结或召回记录已保存，相关任务影响和审计留痕已更新。',
    },
  },
  environment: {
    edit: {
      mode: 'environment-monitor-form',
      validation: ['监测点、区域和在线状态完整', '采集数据与环境条件记录可追溯', '异常影响评价和恢复验证路径已建立'],
      actions: ['保存监控配置', '提交异常/恢复复核'],
    },
    detail: {
      sections: ['监测点与环境条件', '采集数据与趋势', '报警、影响评价与恢复历史'],
      entry: '打开监测点与异常详情',
    },
    modal: {
      variant: 'warning',
      title: '确认环境状态变更',
      action: '确认暂停/恢复',
      content: '环境异常需先控制现场、评价关联任务并完成恢复验证；控制阈值和恢复条件未定事项标记为[待确认]。',
    },
    blocker: {
      reasons: ['监测点离线或采集数据不完整', '环境异常影响范围未评价', '恢复验证和关联任务处置未完成'],
      action: '补充影响评价或返回环境处置',
    },
    success: {
      title: '环境状态已记录',
      message: '监控配置、异常处置或恢复验证已保存，关联任务和审计轨迹已更新。',
    },
    audit: {
      events: ['采集/查看环境数据 · 记录访问', '环境异常与影响评价 · 记录证据', '暂停或恢复验证 · 记录状态变更'],
    },
  },
  qualityControl: {
    edit: {
      mode: 'quality-control-form',
      validation: ['质控项目、批次和控制方式完整', '规则判定与趋势复核证据可追溯', '失控时已暂停相关工作并完成影响评价'],
      actions: ['保存质控草稿', '提交技术复核/放行'],
    },
    detail: {
      sections: ['质控计划与批次', '结果、统计与趋势', '失控、影响评价与放行历史'],
      entry: '打开质控结果与趋势详情',
    },
    modal: {
      variant: 'warning',
      title: '确认质控结果处理',
      action: '确认复核/放行',
      content: '质控失控时暂停相关工作并完成影响评价；判定规则、阈值和放行条件沿用候选规格并标记为[待确认]。',
    },
    blocker: {
      reasons: ['质控结果或规则判定不完整', '失控影响批次未识别或相关工作未暂停', '趋势复核、恢复验证或放行依据缺失'],
      action: '补充质控证据或返回失控调查',
    },
    success: {
      title: '质控处理已记录',
      message: '质控计划、结果复核或恢复放行已保存，影响评价和审计记录已更新。',
    },
    audit: {
      events: ['采集质控结果 · 记录批次', '规则判定/影响评价 · 记录证据', '暂停、恢复或放行 · 记录复核人'],
    },
  },
  capa: {
    edit: {
      mode: 'capa-form',
      validation: ['来源事件、根本原因和责任人完整', '纠正/预防措施可执行且证据要求明确', '措施完成后具备独立有效性验证路径'],
      actions: ['保存 CAPA 草稿', '提交措施审批'],
    },
    detail: {
      sections: ['问题与影响评价', '根因、措施与执行证据', '独立验证、退回与关闭历史'],
      entry: '打开 CAPA 处置详情',
    },
    modal: {
      variant: 'warning',
      title: '确认提交 CAPA 计划或关闭申请',
      action: '确认提交',
      content: '关闭前必须完成措施执行和独立有效性验证；签名、期限或职责分离例外未定事项沿用[待确认]。',
    },
    blocker: {
      reasons: ['根因分析或影响评价证据缺失', '措施执行证据未完成', '独立验证未通过或验证人员不满足条件'],
      action: '补充措施证据或退回整改',
    },
    success: {
      title: 'CAPA 流程已更新',
      message: '措施计划、执行证据或独立验证结论已保存，关闭条件与审计留痕已更新。',
    },
    audit: {
      events: ['登记 CAPA 与根因分析 · 记录责任人', '提交措施证据 · 记录版本', '独立验证/关闭 · 记录验证结论'],
    },
  },
  risk: {
    edit: {
      mode: 'risk-assessment-form',
      validation: ['风险来源、责任人与影响对象完整', '可能性、影响和等级依据可追溯', '应对措施完成并具备剩余风险验证证据'],
      actions: ['保存风险草稿', '提交措施审批/关闭复核'],
    },
    detail: {
      sections: ['风险来源与初始评价', '应对措施与执行跟踪', '剩余风险、验证与关闭历史'],
      entry: '打开风险评价与措施详情',
    },
    modal: {
      variant: 'warning',
      title: '确认风险措施或关闭状态',
      action: '确认提交',
      content: '关闭前需完成措施执行、剩余风险评价和必要验证；风险等级矩阵及接受准则未确定事项标记为[待确认]。',
    },
    blocker: {
      reasons: ['风险等级依据或责任人未确认', '应对措施执行证据缺失', '剩余风险未评价或验证结论不支持关闭'],
      action: '补充风险证据或升级处理',
    },
    success: {
      title: '风险措施已更新',
      message: '风险等级、措施跟踪或关闭复核已保存，剩余风险和审计轨迹可追溯。',
    },
    audit: {
      events: ['登记风险/机遇 · 记录来源', '批准并跟踪应对措施 · 记录变更', '评价剩余风险/关闭或升级 · 记录结论'],
    },
  },
  independentReview: {
    detail: {
      sections: ['申请与受理信息', '独立调查/验证证据', '审核结论、回复与关闭历史'],
      entry: '打开独立审核详情',
    },
    modal: {
      variant: 'warning',
      title: '确认独立调查或验证结论',
      action: '确认提交结论',
      content: '提交前确认调查或验证人员具备独立性；结论、回复和关闭条件沿用候选规格，未定例外标记为[待确认]。',
    },
    blocker: {
      reasons: ['受理信息或调查/验证证据缺失', '调查或验证人员独立性条件未满足', '影响评价、回复或关闭条件未完成'],
      action: '补充独立证据或退回处理',
    },
    success: {
      title: '独立审核结论已提交',
      message: '调查/验证结论、回复节点和关闭待办已保存，过程审计记录已更新。',
    },
  },
};

const interactionProfileAssignments = {
  R01: { preset: 'personnel', override: { detail: { sections: ['身份与岗位', '资格、培训与能力授权', '任职与复核历史'] } } },
  R02: { preset: 'personnel' },
  R03: { preset: 'training' },
  R04: { preset: 'training' },
  R05: { preset: 'personnel', override: {
    edit: { actions: ['保存评价草稿', '提交能力评价结论'] },
    detail: { sections: ['评价对象与范围', '项目、方法、设备与场所证据', '评价结论与授权入口'] },
    modal: { title: '确认提交人员能力评价结论', action: '提交评价结论', content: '提交后进入授权复核；评价证据、复评安排和授权条件未定事项沿用[待确认]。' },
    blocker: { reasons: ['评价项目或方法范围未确认', '现场/记录/结果证据不完整', '评价结论与授权条件不一致'] },
    success: { title: '能力评价结论已提交', message: '人员能力评价、证据索引和授权待办已更新，后续复核保留审计留痕。' },
  } },
  R06: { preset: 'personnel', override: {
    edit: { mode: 'authorization-matrix', actions: ['保存授权草稿', '提交授权审批'] },
    detail: { sections: ['人员与授权维度', '项目、方法、设备与场所范围', '复评、暂停与撤销历史'] },
    modal: { title: '确认批准或暂停人员授权', action: '确认授权状态变更', content: '状态变更需核对能力评价结论和授权范围；复评周期及签名要求未定事项标记为[待确认]。'},
    blocker: { reasons: ['能力评价结论未完成', '授权维度或适用范围缺失', '复评证据不足，不能批准、暂停或撤销'] },
    success: { title: '人员授权状态已更新', message: '授权矩阵、适用范围和暂停/恢复记录已保存，审计轨迹保持完整。' },
  } },
  R07: { preset: 'method' },
  R08: { preset: 'method' },
  R09: { preset: 'method', override: {
    edit: { actions: ['保存验证方案', '提交技术评价'] },
    modal: { title: '确认提交方法验证结论', action: '提交技术评价', content: '提交前确认试验数据、适用范围和判定规则已完成验证；批准条件未定事项标记为[待确认]。'},
    success: { title: '方法验证结论已提交', message: '验证方案、试验数据和技术评价已归档，方法批准节点已更新。' },
  } },
  R10: { preset: 'method', override: {
    edit: { actions: ['保存模型草稿', '提交计算复核'] },
    modal: { title: '确认发布判定规则版本', action: '确认受控发布', content: '发布前确认测量模型、分量评定和计算验证完成；判定阈值及应用边界未定事项标记为[待确认]。'},
  } },
  R11: { preset: 'equipment' },
  R12: { preset: 'equipment' },
  R13: { preset: 'equipment' },
  R14: { preset: 'equipment', override: {
    edit: { actions: ['保存异常草稿', '提交停用/恢复复核'] },
    detail: { sections: ['异常设备与停用标识', '受影响任务与结果评价', '处置、独立核查与恢复历史'] },
    modal: { title: '确认停用或恢复设备', action: '确认停用/恢复', content: '停用前确认受影响任务已识别；恢复前确认维修、校准或核查证据及独立复核已完成，条件未定事项标记为[待确认]。'},
    blocker: { reasons: ['停用标识或异常记录未完成', '受影响任务和结果未完成评价', '恢复验证或独立技术复核证据缺失'], action: '完成影响评价或返回设备处置' },
    success: { title: '设备停用/恢复已记录', message: '设备状态、影响评价和恢复验证已保存，关联任务与审计记录已更新。' },
  } },
  R15: { preset: 'materials' },
  R16: { preset: 'materials' },
  R17: { preset: 'materials', override: {
    edit: { actions: ['保存预警处置', '提交冻结/召回复核'] },
    detail: { sections: ['预警与批次状态', '冻结、补货或召回处置', '关联任务与使用影响评价'] },
    modal: { title: '确认冻结或召回临期/异常批次', action: '确认冻结/召回', content: '临期或过期状态需完成影响评价并通知相关使用方；临期阈值和召回范围未定事项标记为[待确认]。'},
    blocker: { reasons: ['预警批次有效期或库存证据缺失', '临期/过期影响评价未完成', '关联任务与领用记录尚未处置'] },
    success: { title: '批次预警处置已提交', message: '冻结、补货或召回处置和使用影响评价已记录，后续复核节点已建立。' },
  } },
  R18: { preset: 'environment', override: {
    edit: { actions: ['保存监测配置', '提交环境条件复核'] },
    detail: { sections: ['监测点、区域与在线状态', '温湿度数据与趋势', '报警、影响评价与恢复历史'] },
    modal: { title: '确认环境监测点状态变更', action: '确认暂停/恢复', content: '变更前确认采集数据、趋势和关联工作影响；控制阈值及恢复条件沿用候选规格并标记为[待确认]。'},
    blocker: { reasons: ['监测点离线或采集数据不完整', '环境条件偏离影响未评价', '暂停/恢复验证证据缺失'], action: '补充数据或进入异常处置' },
    success: { title: '环境监控状态已更新', message: '监测点配置、环境记录和暂停/恢复状态已保存，审计轨迹已更新。' },
  } },
  R19: { preset: 'environment', override: {
    edit: { actions: ['保存异常调查', '提交恢复验证'] },
    detail: { sections: ['报警时段与偏差', '关联任务与结果影响', '现场控制、恢复验证与结论'] },
    modal: { title: '确认环境异常影响评价与恢复', action: '确认恢复验证', content: '提交前确认现场已控制、关联任务已识别并完成影响评价；恢复判定条件未定事项标记为[待确认]。'},
    blocker: { reasons: ['报警或偏差记录不完整', '关联任务和结果影响未评价', '现场控制或恢复验证未完成'] },
    success: { title: '环境异常处置已提交', message: '异常影响评价、恢复验证和关联任务处置已保存，后续复核可追溯。' },
  } },
  R20: { preset: 'independentReview' },
  R21: { preset: 'independentReview' },
  R22: { preset: 'equipment' },
  R23: { preset: 'equipment' },
  R24: { preset: 'independentReview' },
  R25: { preset: 'independentReview' },
  R26: { preset: 'independentReview' },
  M06: { preset: 'materials' },
  Q01: { preset: 'qualityControl', override: {
    edit: { mode: 'quality-plan-form', actions: ['保存质控计划', '提交技术审批'] },
    detail: { sections: ['风险分析与覆盖范围', '质控方式、频次与责任人', '审批、发布与定期复核历史'] },
    modal: { title: '确认发布质量控制计划', action: '确认发布执行', content: '发布前确认风险分析、质控方式和复核安排完整；频次、阈值和批准要求未定事项标记为[待确认]。'},
    blocker: { reasons: ['风险分析或覆盖项目未完成', '质控方式、频次或责任人未确认', '技术审批证据缺失，不能发布执行'] },
    success: { title: '质量控制计划已发布', message: '质控计划、执行节点和定期复核待办已保存，审计记录已更新。' },
  } },
  Q02: { preset: 'qualityControl' },
  Q03: { preset: 'qualityControl', override: {
    edit: { actions: ['保存失控调查', '提交恢复验证'] },
    detail: { sections: ['失控规则与影响批次', '原因分析与处置措施', '恢复验证与放行历史'] },
    modal: { title: '确认质控失控处置与恢复', action: '确认恢复验证', content: '提交前确认相关工作已暂停、影响批次已评价；恢复条件和判定阈值未定事项标记为[待确认]。'},
    blocker: { reasons: ['失控规则或影响批次未识别', '相关工作未暂停或影响评价缺失', '恢复验证不充分，不能放行'] },
    success: { title: '质控失控处置已提交', message: '暂停、原因分析、影响评价和恢复验证记录已保存，放行节点等待复核。' },
  } },
  Q04: { preset: 'qualityControl', override: {
    edit: { mode: 'proficiency-plan-form', actions: ['保存能力验证计划', '提交计划批准'] },
    detail: { sections: ['能力范围与覆盖分析', '活动、组织方与计划时间', '批准、实施跟踪与处置历史'] },
    modal: { title: '确认批准能力验证年度计划', action: '确认批准计划', content: '批准前确认能力范围、风险覆盖和活动安排完整；参与频次、判定指标和替代方案未定事项标记为[待确认]。'},
    blocker: { reasons: ['能力范围或风险覆盖分析缺失', '活动组织方、时间或责任人未确认', '计划批准依据不完整'] },
    success: { title: '能力验证计划已提交', message: '年度计划、实施跟踪节点和异常处置入口已建立，审计记录已更新。' },
  } },
  Q05: { preset: 'qualityControl', override: {
    edit: { actions: ['保存评价草稿', '提交技术评价'] },
    detail: { sections: ['项目实施与结果指标', '技术评价与不满意处置', '报告接收、复核与归档历史'] },
    blocker: { reasons: ['结果或组织方报告未接收', '技术评价证据不完整', '不满意结果处置或后续措施未完成'] },
  } },
  Q06: { preset: 'independentReview' },
  Q07: { preset: 'independentReview', override: {
    edit: { mode: 'complaint-review-form', fields: ['投诉编号', '客户', '调查人员', '处理结论'], actions: ['保存受理草稿', '提交独立调查结论'] },
    detail: { sections: ['投诉受理与客户信息', '独立调查与审核证据', '正式回复、关闭与审计历史'] },
    modal: { title: '确认投诉调查与正式回复', action: '确认提交回复', content: '提交前确认调查人员独立、处理结论已审核并完成正式回复；回复时限与签名要求未定事项标记为[待确认]。'},
    blocker: { reasons: ['投诉受理信息或调查证据缺失', '调查人员独立性条件未满足', '审核结论或正式回复未完成，不能关闭记录'] },
    success: { title: '投诉处理结论已提交', message: '独立调查、正式回复和关闭待办已保存，客户沟通与审计记录可追溯。' },
  } },
  Q08: { preset: 'qualityControl' },
  Q09: { preset: 'capa' },
  Q10: { preset: 'capa', override: {
    edit: { mode: 'independent-verification-form', actions: ['保存验证草稿', '提交关闭复核'] },
    detail: { sections: ['CAPA 措施与执行证据', '独立验证方案与结论', '退回补充、通过与关闭历史'] },
    modal: { title: '确认 CAPA 有效性验证与关闭', action: '确认关闭复核', content: '关闭前确认验证人员独立、证据充分且持续有效；验证周期和签名要求未定事项标记为[待确认]。'},
    blocker: { reasons: ['措施执行证据缺失', '验证人员独立性或验证方案不满足', '有效性结论不支持关闭，需退回补充'] },
    success: { title: 'CAPA 有效性验证已提交', message: '独立验证结论、关闭条件和后续审批节点已记录，审计留痕已更新。' },
  } },
  Q11: { preset: 'risk' },
  Q12: { preset: 'risk', override: {
    edit: { mode: 'risk-matrix-form', actions: ['保存风险评价', '提交措施批准/关闭复核'] },
    detail: { sections: ['风险等级与评价依据', '应对措施与执行跟踪', '剩余风险、验证与关闭/升级历史'] },
    modal: { title: '确认风险措施与剩余风险结论', action: '确认提交结论', content: '提交前确认风险等级依据、措施证据和剩余风险评价完整；接受准则和关闭条件未定事项标记为[待确认]。'},
    blocker: { reasons: ['风险等级或评价依据未确认', '应对措施执行证据缺失', '剩余风险未完成独立验证，不能关闭'] },
    success: { title: '风险评价结论已提交', message: '措施跟踪、剩余风险和关闭/升级节点已保存，验证与审计轨迹保持完整。' },
  } },
};

export const resourceQualityFlowDefinitions = [
  { id: 'P05', title: '人员培训到岗位授权', module: '资源管理', pageIds: ['R01', 'R02', 'R03', 'R04', 'R05', 'R06'] },
  { id: 'P06', title: '设备采购到报废', module: '资源管理', pageIds: ['R22', 'R23', 'R24', 'R11', 'R12', 'R13', 'R14'] },
  { id: 'P08', title: '不符合项发现到整改关闭', module: '质量管理', pageIds: ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'] },
  { id: 'P11', title: '能力验证计划到结果评价', module: '质量管理', pageIds: ['Q04', 'Q05', 'Q09', 'Q10'] },
  { id: 'RF02', title: '方法与标准受控', module: '资源管理', pageIds: ['R07', 'R08', 'R09', 'R10'] },
  { id: 'RF04', title: '物料批次生命周期', module: '资源管理', pageIds: ['R15', 'R16', 'R17', 'M06'] },
  { id: 'RF05', title: '环境异常与恢复', module: '资源管理', pageIds: ['R18', 'R19'] },
  { id: 'RF06', title: '供应商准入与采购验收', module: '资源管理', pageIds: ['R20', 'R22', 'R23', 'R24', 'R21'] },
  { id: 'RF07', title: '分包评审到结果验收', module: '资源管理', pageIds: ['R25', 'R26'] },
  { id: 'QF01', title: '质量控制闭环', module: '质量管理', pageIds: ['Q01', 'Q02', 'Q03', 'Q09', 'Q10'] },
  { id: 'QF02', title: '能力验证实施闭环', module: '质量管理', pageIds: ['Q04', 'Q05', 'Q09', 'Q10'] },
  { id: 'QF03', title: '质量事件与 CAPA 闭环', module: '质量管理', pageIds: ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'] },
  { id: 'QF04', title: '风险与机会闭环', module: '质量管理', pageIds: ['Q11', 'Q12'] },
];

const flowMetadataByPage = {
  R01: { flowIds: ['P05'], flowNode: '人员档案与资格登记', primaryNext: 'R02', returnTarget: 'R01', alternatePaths: [{ label: '资格资料补充', target: 'R01' }], allowedActions: ['新建档案', '维护资格', '提交复核'] },
  R02: { flowIds: ['P05'], flowNode: '资质证据与技术复核', primaryNext: 'R03', returnTarget: 'R01', alternatePaths: [{ label: '资质到期或证据缺失', target: 'R01' }], allowedActions: ['登记资质', '上传证明', '技术复核'] },
  R03: { flowIds: ['P05'], flowNode: '培训需求与计划发布', primaryNext: 'R04', returnTarget: 'R02', alternatePaths: [{ label: '计划退回调整', target: 'R03' }], allowedActions: ['识别需求', '编辑计划', '提交审批', '发布通知'] },
  R04: { flowIds: ['P05'], flowNode: '培训执行、考核与有效性评价', primaryNext: 'R05', returnTarget: 'R03', alternatePaths: [{ label: '考核不通过或证据缺失', target: 'R03' }], allowedActions: ['签到学习', '录入考核', '评价有效性', '归档记录'] },
  R05: { flowIds: ['P05'], flowNode: '人员能力评价', primaryNext: 'R06', returnTarget: 'R04', alternatePaths: [{ label: '能力证据不足', target: 'R04' }], allowedActions: ['发起评价', '关联证据', '提交结论', '安排复评'] },
  R06: { flowIds: ['P05'], flowNode: '岗位授权与复评', primaryNext: null, returnTarget: 'R05', alternatePaths: [{ label: '暂停或撤销授权', target: 'R01' }, { label: '授权复评', target: 'R05' }], allowedActions: ['定义授权范围', '批准授权', '暂停授权', '撤销授权', '发起复评'] },

  R07: { flowIds: ['RF02'], flowNode: '方法与标准登记', primaryNext: 'R08', returnTarget: 'R07', alternatePaths: [{ label: '发起受控修订', target: 'R08' }], allowedActions: ['登记方法', '关联标准', '查看版本', '发起查新'] },
  R08: { flowIds: ['RF02'], flowNode: '标准查新与影响评价', primaryNext: 'R09', returnTarget: 'R07', alternatePaths: [{ label: '无需验证的受控更新', target: 'R10' }, { label: '影响资料补充', target: 'R08' }], allowedActions: ['执行查新', '识别变化', '评价影响', '提交技术审核'] },
  R09: { flowIds: ['RF02'], flowNode: '方法验证与确认', primaryNext: 'R10', returnTarget: 'R08', alternatePaths: [{ label: '验证不通过', target: 'R08' }], allowedActions: ['制定方案', '录入试验', '汇总数据', '提交技术评价'] },
  R10: { flowIds: ['RF02'], flowNode: '判定规则复核与受控发布', primaryNext: null, returnTarget: 'R09', alternatePaths: [{ label: '模型或规则需重算', target: 'R09' }, { label: '版本复审', target: 'R08' }], allowedActions: ['维护模型', '复核计算', '批准发布', '查看应用范围'] },

  R11: { flowIds: ['P06'], flowNode: '设备建档、投用或报废归档', primaryNext: 'R12', returnTarget: 'R24', alternatePaths: [{ label: '设备报废归档', target: 'R11' }, { label: '异常停用', target: 'R14' }], allowedActions: ['设备建档', '投入使用', '更新状态', '报废归档'] },
  R12: { flowIds: ['P06'], flowNode: '校准、核查与维护计划', primaryNext: 'R13', returnTarget: 'R11', alternatePaths: [{ label: '计划逾期或异常', target: 'R14' }], allowedActions: ['制定计划', '审批计划', '确认结果', '更新设备状态'] },
  R13: { flowIds: ['P06'], flowNode: '设备使用与维护记录', primaryNext: 'R14', returnTarget: 'R12', alternatePaths: [{ label: '记录正常使用', target: 'R13' }, { label: '提交设备异常', target: 'R14' }], allowedActions: ['使用前检查', '登记使用', '登记维护', '提交异常'] },
  R14: { flowIds: ['P06'], flowNode: '设备异常、影响评价与恢复', primaryNext: 'R11', returnTarget: 'R13', alternatePaths: [{ label: '恢复前校准或核查', target: 'R12' }, { label: '报废归档', target: 'R11' }], allowedActions: ['停用标识', '登记异常', '评价影响', '提交恢复复核', '发起报废'] },
  R22: { flowIds: ['P06', 'RF06'], flowNode: '采购申请与审批', primaryNext: 'R23', returnTarget: 'R22', alternatePaths: [{ label: '供应商不满足准入条件', target: 'R20' }], allowedActions: ['提出需求', '确认技术要求', '提交预算审批', '选择供应商'] },
  R23: { flowIds: ['P06', 'RF06'], flowNode: '订单下达与到货跟踪', primaryNext: 'R24', returnTarget: 'R22', alternatePaths: [{ label: '交付偏差处理', target: 'R23' }], allowedActions: ['下达订单', '跟踪交付', '登记到货', '登记偏差', '移交验收'] },
  R24: { flowIds: ['P06', 'RF06'], flowNode: '采购验收与服务评价', primaryNext: 'R11', returnTarget: 'R23', alternatePaths: [{ label: '验收不合格', target: 'R23' }, { label: '供应商绩效评价', target: 'R21' }], allowedActions: ['核对订单', '执行验收', '登记偏差', '确认接收', '评价供应商'] },
  R20: { flowIds: ['RF06'], flowNode: '供应商准入评审', primaryNext: 'R22', returnTarget: 'R20', alternatePaths: [{ label: '资料或能力不满足', target: 'R20' }], allowedActions: ['提交准入申请', '审查资料', '评价能力', '批准准入', '维护名录'] },
  R21: { flowIds: ['RF06'], flowNode: '供应商绩效再评价', primaryNext: null, returnTarget: 'R24', alternatePaths: [{ label: '绩效不合格或暂停', target: 'R20' }], allowedActions: ['汇总履约记录', '部门评分', '质量复核', '维持名录', '暂停供应商'] },

  R15: { flowIds: ['RF04'], flowNode: '物料主数据与批次登记', primaryNext: 'R16', returnTarget: 'R15', alternatePaths: [{ label: '批次预警', target: 'R17' }], allowedActions: ['维护主数据', '登记批次', '查看库存', '发起入库'] },
  R16: { flowIds: ['RF04'], flowNode: '到货验收、入库与领用', primaryNext: 'R17', returnTarget: 'R15', alternatePaths: [{ label: '验收不合格', target: 'R16' }, { label: '扫码现场操作', target: 'M06' }], allowedActions: ['到货核对', '质量验收', '确认入库', '扫码领用', '登记退库'] },
  R17: { flowIds: ['RF04'], flowNode: '库存预警、冻结与召回', primaryNext: null, returnTarget: 'R16', alternatePaths: [{ label: '补货后重新入库', target: 'R16' }, { label: '批次影响复核', target: 'R17' }], allowedActions: ['确认预警', '冻结批次', '发起召回', '评价使用影响', '提交复核'] },
  M06: { flowIds: ['P06', 'RF04'], flowNode: '设备与物料扫码现场操作', primaryNext: 'R13', returnTarget: 'R16', alternatePaths: [{ label: '设备异常上报', target: 'R14' }, { label: '物料领用或退库', target: 'R16' }], allowedActions: ['扫描标识', '核验状态', '执行点检', '领用物料', '提交异常', '同步记录'] },

  R18: { flowIds: ['RF05'], flowNode: '环境监测与趋势复核', primaryNext: 'R19', returnTarget: 'R18', alternatePaths: [{ label: '监测点离线或数据缺失', target: 'R18' }], allowedActions: ['配置监测点', '采集数据', '查看趋势', '判定阈值', '确认报警'] },
  R19: { flowIds: ['RF05'], flowNode: '环境异常控制、影响评价与恢复', primaryNext: 'R18', returnTarget: 'R18', alternatePaths: [{ label: '恢复验证失败', target: 'R19' }], allowedActions: ['控制现场', '识别任务', '评价影响', '提交恢复验证', '解除限制'] },

  R25: { flowIds: ['RF07'], flowNode: '分包评审与客户同意', primaryNext: 'R26', returnTarget: 'R25', alternatePaths: [{ label: '客户未同意或能力不匹配', target: 'R25' }], allowedActions: ['提出分包', '评价能力', '确认责任', '记录客户同意', '批准执行'] },
  R26: { flowIds: ['RF07'], flowNode: '分包执行与结果验收', primaryNext: null, returnTarget: 'R25', alternatePaths: [{ label: '结果验收不通过', target: 'R26' }], allowedActions: ['下达任务', '交接样品', '跟踪进度', '验收结果', '纳入报告'] },

  Q01: { flowIds: ['QF01'], flowNode: '质量控制计划审批发布', primaryNext: 'Q02', returnTarget: 'Q01', alternatePaths: [{ label: '计划退回调整', target: 'Q01' }], allowedActions: ['分析风险', '编辑计划', '提交技术审批', '发布执行'] },
  Q02: { flowIds: ['QF01'], flowNode: '质控结果判定与趋势复核', primaryNext: null, returnTarget: 'Q01', alternatePaths: [{ label: '触发失控调查', target: 'Q03' }], allowedActions: ['采集结果', '统计计算', '规则判定', '复核趋势', '放行结果'] },
  Q03: { flowIds: ['QF01', 'P08'], flowNode: '质控失控调查与恢复验证', primaryNext: 'Q09', returnTarget: 'Q02', alternatePaths: [{ label: '恢复后返回质控结果', target: 'Q02' }, { label: '转不符合控制', target: 'Q08' }], allowedActions: ['暂停工作', '调查原因', '评价影响', '提交恢复验证', '发起 CAPA'] },
  Q04: { flowIds: ['P11', 'QF02'], flowNode: '能力验证年度计划', primaryNext: 'Q05', returnTarget: 'Q04', alternatePaths: [{ label: '计划退回调整', target: 'Q04' }], allowedActions: ['分析覆盖需求', '选择活动', '编辑计划', '提交批准', '跟踪实施'] },
  Q05: { flowIds: ['P11', 'QF02'], flowNode: '能力验证实施与结果评价', primaryNext: null, returnTarget: 'Q04', alternatePaths: [{ label: '不满意结果转 CAPA', target: 'Q09' }], allowedActions: ['确认报名', '提交结果', '接收报告', '技术评价', '归档处置'] },
  Q06: { flowIds: ['P08', 'QF03'], flowNode: '质量事件受理与分流', primaryNext: 'Q08', returnTarget: 'Q06', alternatePaths: [{ label: '投诉或申诉处理', target: 'Q07' }], allowedActions: ['登记事件', '初步分级', '分配责任', '启动调查', '转入处置'] },
  Q07: { flowIds: ['P08', 'QF03'], flowNode: '投诉与申诉独立调查', primaryNext: null, returnTarget: 'Q06', alternatePaths: [{ label: '转不符合或 CAPA', target: 'Q09' }], allowedActions: ['接收投诉', '确认受理', '独立调查', '审核结论', '正式回复', '关闭记录'] },
  Q08: { flowIds: ['P08', 'QF03'], flowNode: '不符合工作控制与影响评价', primaryNext: 'Q09', returnTarget: 'Q06', alternatePaths: [{ label: '恢复工作后关闭', target: 'Q06' }], allowedActions: ['立即控制', '评价影响', '决定处置', '通知相关方', '恢复工作', '发起 CAPA'] },
  Q09: { flowIds: ['P08', 'P11', 'QF01', 'QF02', 'QF03'], flowNode: 'CAPA 根因分析与措施执行', primaryNext: 'Q10', returnTarget: 'Q08', alternatePaths: [{ label: '措施退回补充', target: 'Q09' }], allowedActions: ['确认问题', '分析根因', '制定措施', '提交审批', '提交执行证据'] },
  Q10: { flowIds: ['P08', 'P11', 'QF01', 'QF02', 'QF03'], flowNode: 'CAPA 独立有效性验证与关闭', primaryNext: null, returnTarget: 'Q09', alternatePaths: [{ label: '验证不通过退回整改', target: 'Q09' }], allowedActions: ['核对证据', '评价有效性', '退回补充', '批准关闭'] },
  Q11: { flowIds: ['QF04'], flowNode: '风险与机会登记', primaryNext: 'Q12', returnTarget: 'Q11', alternatePaths: [{ label: '重大风险转质量事件', target: 'Q06' }], allowedActions: ['识别风险', '登记责任', '初步评价', '制定应对'] },
  Q12: { flowIds: ['QF04'], flowNode: '风险措施与剩余风险评价', primaryNext: null, returnTarget: 'Q11', alternatePaths: [{ label: '风险升级为质量事件', target: 'Q06' }, { label: '措施补充', target: 'Q12' }], allowedActions: ['确定等级', '批准措施', '跟踪执行', '评价剩余风险', '关闭或升级'] },
};

const resourceQualityPageIds = new Set([...resourcePages, ...qualityPages].map((item) => item.id));
const referencedFlowPageIds = [
  ...resourceQualityFlowDefinitions.flatMap((flow) => flow.pageIds),
  ...Object.values(flowMetadataByPage).flatMap((metadata) => [
    metadata.primaryNext,
    metadata.returnTarget,
    ...metadata.alternatePaths.map((path) => path.target),
  ]),
].filter(Boolean);
const missingFlowPageIds = [...new Set(referencedFlowPageIds.filter((id) => !resourceQualityPageIds.has(id)))];
if (missingFlowPageIds.length) throw new Error(`资源与质量流程引用了不存在的页面: ${missingFlowPageIds.join(', ')}`);

const pageById = new Map([...resourcePages, ...qualityPages].map((item) => [item.id, item]));

const flowDefinitionsForPage = (item) => resourceQualityFlowDefinitions.filter((flow) => (
  item.flowIds?.includes(flow.id) && flow.pageIds.includes(item.id)
));

const interactionFlowForPage = (item) => {
  const definitions = flowDefinitionsForPage(item);
  const definition = definitions[0];
  if (!definition) return {};

  const contexts = definitions.map((candidate) => {
    const steps = candidate.pageIds.map((pageId) => (
      flowMetadataByPage[pageId]?.flowNode || pageById.get(pageId)?.title || pageId
    ));
    const currentStep = candidate.pageIds.indexOf(item.id) + 1;
    return {
      flowId: candidate.id,
      flowTitle: candidate.title,
      steps,
      currentStep,
      nodeIndex: currentStep,
      nodeState: currentStep === steps.length ? 'terminal' : 'current',
      normalNext: item.primaryNext,
      returnTarget: item.returnTarget,
      blockedTarget: item.alternatePaths?.[0]?.target || item.returnTarget,
      terminal: currentStep === steps.length,
    };
  });
  const [primaryContext] = contexts;
  const { steps, currentStep, terminal } = primaryContext;

  return {
    primaryFlowId: primaryContext.flowId,
    flow: {
      steps,
      currentStep,
      pending: terminal ? '当前节点为流程终态；如需继续，请受控发起新版本或新申请' : steps[currentStep],
    },
    flowContext: {
      flowId: primaryContext.flowId,
      flowTitle: primaryContext.flowTitle,
      nodeIndex: currentStep,
      nodeCount: steps.length,
      terminal,
      primaryNext: item.primaryNext,
      returnTarget: item.returnTarget,
    },
    flowContexts: contexts.map(({ steps: contextSteps, ...context }) => ({
      ...context,
      steps: contextSteps,
      nodeCount: contextSteps.length,
    })),
  };
};

const listPageActionTargets = {
  R01: { create: 'R01-CREATE', viewFull: 'R02' },
  R07: { create: 'R07-CREATE', viewFull: 'R07-DETAIL' },
  R11: { create: 'R11-CREATE', viewFull: 'R11-DETAIL' },
  R15: { create: 'R15-CREATE', viewFull: 'R15-DETAIL' },
  R21: { create: 'R21-CREATE', viewFull: 'R21-DETAIL' },
  R23: { create: 'R23-CREATE', viewFull: 'R23-DETAIL' },
  Q06: { create: 'Q06-CREATE', viewFull: 'Q06-DETAIL' },
  Q11: { create: 'Q11-CREATE', viewFull: 'Q11-DETAIL' },
};

const actionModeForLabel = (label) => {
  if (/查看|预览|上传|关联/.test(label)) return 'detail';
  if (/新建|建档|登记|提出|识别风险|配置监测点|制定方案|制定计划|发起评价/.test(label)) return 'create';
  if (/编辑|维护|更新|定义|录入|补充|选择|制定/.test(label)) return 'edit';
  if (/审核|审查|复核|评审|评价|验收|核对|判定|审批|批准/.test(label)) return 'audit';
  if (/执行|实施|调查|控制|跟踪|移交|转入|发起|下达|恢复|提交/.test(label)) return 'execute';
  return 'inline';
};

const actionKeyForLabel = (label, mode, index) => {
  const semanticKeys = [
    [/新增|新建|建档/, 'create'],
    [/查看.*完整|完整.*档案/, 'viewFull'],
    [/查看|预览/, 'view'],
    [/编辑|维护|更新/, 'edit'],
    [/审核|审查|复核|评审/, 'audit'],
    [/审批|批准/, 'approve'],
    [/发布/, 'publish'],
    [/执行|实施/, 'execute'],
    [/归档/, 'archive'],
    [/关闭/, 'close'],
    [/导出/, 'export'],
    [/查询|搜索/, 'search'],
  ];
  const semanticKey = semanticKeys.find(([pattern]) => pattern.test(label))?.[1] || mode;
  return `${semanticKey}${index + 1}`;
};

const modalActionPattern = /确认|批准|发布|暂停|撤销|冻结|关闭|归档|解除|放行|接收|维持|报废/;
const inlineActionPattern = /查询|搜索|筛选|重置|导出|采集|统计|计算|扫描|同步|通知|核验状态|上传|关联/;

const actionContractForLabel = (item, label, index) => {
  const mode = actionModeForLabel(label);
  const actionId = `${item.id}.${actionKeyForLabel(label, mode, index)}`;
  const base = {
    actionId,
    label,
    placement: item.kind === 'listDrawer' ? 'row' : 'actionBar',
    returnTarget: item.id,
    flowAnchorPageId: item.id,
    visibleWhen: '当前用户具备该操作权限，且业务对象未处于只读终态',
  };

  if (mode === 'detail') {
    return { ...base, surface: 'drawer', variantFrameId: `${item.id}-DRAWER-${index + 1}` };
  }
  if (modalActionPattern.test(label) && mode !== 'audit') {
    return { ...base, surface: 'modal', variantFrameId: `${item.id}-MODAL-${index + 1}` };
  }
  if (inlineActionPattern.test(label) || mode === 'inline') {
    return { ...base, surface: 'inline', effect: `${label}后刷新当前页状态、证据与审计时间线` };
  }

  const advancesFlow = /提交|移交|转入|发起 CAPA|进入/.test(label) && item.primaryNext;
  return {
    ...base,
    surface: 'page',
    targetPageId: advancesFlow ? item.primaryNext : `${item.id}-${mode.toUpperCase()}`,
  };
};

const actionContractsForPage = (item) => {
  const contracts = (item.allowedActions || []).map((label, index) => actionContractForLabel(item, label, index));
  const listTargets = listPageActionTargets[item.id];
  if (!listTargets) return contracts;

  const listContracts = [
    {
      actionId: `${item.id}.create`,
      label: '新增',
      placement: 'header',
      surface: 'page',
      targetPageId: listTargets.create,
      returnTarget: item.id,
      flowAnchorPageId: item.id,
      visibleWhen: '当前用户具备新增权限，且前置业务条件满足',
    },
    {
      actionId: `${item.id}.viewFull`,
      label: '查看完整档案',
      placement: 'row',
      surface: 'page',
      targetPageId: listTargets.viewFull,
      returnTarget: item.id,
      flowAnchorPageId: item.id,
      visibleWhen: '列表存在选中记录，且当前用户具备查看权限',
    },
    {
      actionId: `${item.id}.search`,
      label: '查询',
      placement: 'filterBar',
      surface: 'inline',
      effect: '应用筛选条件并刷新列表、分页与结果统计',
      returnTarget: item.id,
      flowAnchorPageId: item.id,
      visibleWhen: '页面已完成加载',
    },
    {
      actionId: `${item.id}.export`,
      label: '导出',
      placement: 'header',
      surface: 'inline',
      effect: '按当前筛选条件导出受权限控制的数据并写入审计记录',
      returnTarget: item.id,
      flowAnchorPageId: item.id,
      visibleWhen: '当前用户具备导出权限且列表存在可导出记录',
    },
  ];
  return [...listContracts, ...contracts.filter((contract) => !listContracts.some((fixed) => fixed.actionId === contract.actionId))];
};

const hiddenPageKind = {
  CREATE: 'form',
  EDIT: 'form',
  AUDIT: 'review',
  EXECUTE: 'detail',
};

const hiddenPageTitle = {
  CREATE: '新增',
  EDIT: '编辑',
  AUDIT: '审核',
  EXECUTE: '执行',
  DETAIL: '完整档案',
};

const createHiddenOperationPage = (source, targetPageId, contract) => {
  const mode = targetPageId.split('-').at(-1);
  const titleSuffix = hiddenPageTitle[mode] || contract.label;
  const flowContexts = (source.flowContexts || []).map((context) => ({
    ...context,
    nodeState: context.terminal ? 'terminal' : 'current',
    normalNext: source.primaryNext,
    returnTarget: source.id,
    blockedTarget: source.alternatePaths?.[0]?.target || source.id,
  }));
  const flowContext = source.flowContext ? {
    ...source.flowContext,
    returnTarget: source.id,
  } : undefined;
  const actionContracts = [
    {
      actionId: `${targetPageId}.saveDraft`,
      label: '保存草稿',
      placement: 'formFooter',
      surface: 'inline',
      effect: '保存当前输入但不推进流程，并更新时间线',
      returnTarget: targetPageId,
      flowAnchorPageId: source.id,
      visibleWhen: '页面可编辑且当前用户具备保存权限',
    },
    {
      actionId: `${targetPageId}.validate`,
      label: '校验表单',
      placement: 'formFooter',
      surface: 'inline',
      effect: '执行必填项、格式、前置条件与证据完整性校验，并定位首个错误',
      returnTarget: targetPageId,
      flowAnchorPageId: source.id,
      visibleWhen: '页面可编辑且表单已完成加载',
    },
    {
      actionId: `${targetPageId}.submit`,
      label: '确认提交',
      placement: 'formFooter',
      surface: 'modal',
      variantFrameId: `${targetPageId}-MODAL-SUBMIT`,
      returnTarget: source.id,
      flowAnchorPageId: source.id,
      visibleWhen: '必填项、证据和前置条件校验全部通过',
    },
    {
      actionId: `${targetPageId}.back`,
      label: '返回来源页',
      placement: 'pageHeader',
      surface: 'page',
      targetPageId: source.id,
      returnTarget: source.id,
      flowAnchorPageId: source.id,
      visibleWhen: '页面已完成加载',
    },
  ];
  const allowedActions = actionContracts.map((item) => item.label);
  return {
    ...source,
    id: targetPageId,
    title: `${source.title}·${titleSuffix}`,
    root: source.id.startsWith('Q') ? '质量管理' : '资源管理',
    kind: hiddenPageKind[mode] || 'detail',
    goal: `${contract.label}：${source.goal}`,
    pageType: '操作页',
    entry: `${source.entry} > ${titleSuffix}`,
    back: source.title,
    hidden: true,
    sourcePageId: source.id,
    actionMode: mode.toLowerCase(),
    flowNode: `${source.flowNode}·${titleSuffix}`,
    returnTarget: source.id,
    alternatePaths: [{ label: '取消或校验失败返回来源页', target: source.id }],
    allowedActions,
    actionContracts,
    primaryFlowId: source.primaryFlowId,
    flowContext,
    flowContexts,
    interactionProfile: {
      ...source.interactionProfile,
      allowedActions,
      flow: source.interactionProfile?.flow,
    },
  };
};

const validateInteractionFlowMetadata = () => {
  for (const item of pageById.values()) {
    const metadata = flowMetadataByPage[item.id];
    if (!metadata?.flowIds?.length) throw new Error(`资源与质量页面 ${item.id} 缺少流程元数据`);
    if (!metadata.alternatePaths?.length) throw new Error(`资源与质量页面 ${item.id} 缺少退回或阻断去向`);
    const flow = interactionFlowForPage({ ...item, ...metadata }).flow;
    if (!flow?.steps?.length || flow.currentStep < 1 || flow.currentStep > flow.steps.length) {
      throw new Error(`资源与质量页面 ${item.id} 的当前步骤不在流程范围内`);
    }
  }
};

validateInteractionFlowMetadata();

const withInteractionProfile = (item) => {
  const assignment = interactionProfileAssignments[item.id] || {};
  const { flow: _globalFlow, ...pageFlowContext } = interactionFlowForPage(item);
  return {
    ...item,
    ...pageFlowContext,
    interactionProfile: mergeProfileSections(
      interactionProfileBase(item),
      interactionProfilePresets[assignment.preset],
      assignment.override,
    ),
  };
};

const withRenderFamilies = (pages) => pages.map((item) => withInteractionProfile({
  ...item,
  ...(flowMetadataByPage[item.id] || {}),
  ...(renderFamilies[item.id] ? { renderFamily: renderFamilies[item.id] } : {}),
}));

const withActionContracts = (pages) => pages.map((item) => {
  const actionContracts = actionContractsForPage(item);
  const allowedActions = actionContracts.map((contract) => contract.label);
  return {
    ...item,
    allowedActions,
    actionContracts,
    interactionProfile: {
      ...item.interactionProfile,
      allowedActions,
    },
  };
});

const resourceBasePages = withActionContracts(withRenderFamilies(resourcePages));
const qualityBasePages = withActionContracts(withRenderFamilies(qualityPages));
const allBasePages = [...resourceBasePages, ...qualityBasePages];
const basePageById = new Map(allBasePages.map((item) => [item.id, item]));
const hiddenOperationTargets = new Map();

for (const source of allBasePages) {
  for (const contract of source.actionContracts) {
    if (contract.surface !== 'page' || basePageById.has(contract.targetPageId)) continue;
    if (!hiddenOperationTargets.has(contract.targetPageId)) {
      hiddenOperationTargets.set(contract.targetPageId, createHiddenOperationPage(source, contract.targetPageId, contract));
    }
  }
}

const hiddenOperationPages = [...hiddenOperationTargets.values()];
const exportedPages = [...allBasePages, ...hiddenOperationPages];
const duplicatePageIds = exportedPages
  .map((item) => item.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicatePageIds.length) throw new Error(`资源与质量页面 ID 重复: ${[...new Set(duplicatePageIds)].join(', ')}`);
const exportedPageById = new Map(exportedPages.map((item) => [item.id, item]));

const validateActionContracts = () => {
  const actionIds = new Set();
  let hiddenPageWithIndependentLocalFlow = false;
  const assertUniqueLabels = (labels, context) => {
    const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
    if (duplicates.length) throw new Error(`${context} 存在重复动作标签: ${[...new Set(duplicates)].join(', ')}`);
  };
  const assertSameLabels = (expected, actual, context) => {
    const expectedSet = new Set(expected);
    const actualSet = new Set(actual);
    const missing = expected.filter((label) => !actualSet.has(label));
    const extra = actual.filter((label) => !expectedSet.has(label));
    if (missing.length || extra.length) {
      throw new Error(`${context} 动作声明与契约不一致；缺少: ${missing.join(', ') || '无'}；多余: ${extra.join(', ') || '无'}`);
    }
  };
  for (const item of exportedPageById.values()) {
    if (!item.actionContracts?.length) throw new Error(`资源与质量页面 ${item.id} 缺少 actionContracts`);
    const contractLabels = item.actionContracts.map((contract) => contract.label);
    const declaredLabels = item.allowedActions || [];
    const profileLabels = item.interactionProfile?.allowedActions || [];
    assertUniqueLabels(contractLabels, `资源与质量页面 ${item.id} 的 actionContracts`);
    assertUniqueLabels(declaredLabels, `资源与质量页面 ${item.id} 的 allowedActions`);
    assertUniqueLabels(profileLabels, `资源与质量页面 ${item.id} 的 interactionProfile.allowedActions`);
    assertSameLabels(contractLabels, declaredLabels, `资源与质量页面 ${item.id}`);
    assertSameLabels(contractLabels, profileLabels, `资源与质量页面 ${item.id} interactionProfile`);

    const localSteps = item.interactionProfile?.flow?.steps || [];
    const localCurrentStep = item.interactionProfile?.flow?.currentStep;
    if (!localSteps.length || localCurrentStep < 1 || localCurrentStep > localSteps.length) {
      throw new Error(`资源与质量页面 ${item.id} 的局部操作步骤无效`);
    }
    const primaryContext = item.flowContexts?.find((context) => context.flowId === item.primaryFlowId);
    if (!primaryContext?.steps?.length) throw new Error(`资源与质量页面 ${item.id} 缺少主流程上下文步骤`);
    if (item.hidden && JSON.stringify(localSteps) !== JSON.stringify(primaryContext.steps)) {
      hiddenPageWithIndependentLocalFlow = true;
    }

    for (const contract of item.actionContracts) {
      for (const field of ['actionId', 'label', 'placement', 'surface', 'returnTarget', 'flowAnchorPageId', 'visibleWhen']) {
        if (!contract[field]) throw new Error(`资源与质量页面 ${item.id} 的动作契约缺少 ${field}`);
      }
      if (actionIds.has(contract.actionId)) throw new Error(`资源与质量动作 ID 重复: ${contract.actionId}`);
      actionIds.add(contract.actionId);
      if (contract.surface === 'page' && !contract.targetPageId) throw new Error(`页面动作 ${contract.actionId} 缺少 targetPageId`);
      if (['drawer', 'modal'].includes(contract.surface) && !contract.variantFrameId) {
        throw new Error(`状态动作 ${contract.actionId} 缺少 variantFrameId`);
      }
      if (contract.surface === 'inline' && !contract.effect) throw new Error(`页内动作 ${contract.actionId} 缺少 effect`);
      for (const target of [contract.targetPageId, contract.returnTarget, contract.flowAnchorPageId].filter(Boolean)) {
        if (!exportedPageById.has(target)) throw new Error(`动作 ${contract.actionId} 引用了不存在的页面 ${target}`);
      }
    }
  }
  if (!hiddenPageWithIndependentLocalFlow) {
    throw new Error('资源与质量隐藏操作页未保留独立于主流程的局部操作步骤');
  }
};

validateActionContracts();

const hiddenPagesForRoot = (root) => hiddenOperationPages.filter((item) => item.root === root);

export const resourceDomains = [
  {
    basename: 'cnas-06-resource-management',
    root: '资源管理',
    pages: [...resourceBasePages, ...hiddenPagesForRoot('资源管理')],
  },
  {
    basename: 'cnas-07-quality-management',
    root: '质量管理',
    pages: [...qualityBasePages, ...hiddenPagesForRoot('质量管理')],
  },
];
