// P01-P04 流程定义目录
// 直接对应规格文件 businessFlowCatalog 的结构，驱动步骤条和流程轨迹。

export const FlowCatalog = [
  {
    id: 'P01',
    title: '客户与委托受理',
    module: '客户与委托',
    responsibleRoles: '客户服务人员、合同评审人、技术负责人、样品管理员与任务管理员',
    primaryPath: ['CC01', 'CC02', 'CC04', 'CC06', 'CC07', 'CC05', 'SM01'],
    terminal: 'TM01',
    entryPages: ['CC01', 'CC03'],
    detailPages: ['CC02', 'CC05'],
    editPages: ['CC02', 'CC04', 'CC06'],
    approvalPages: ['CC06', 'CC07', 'CC08'],
    handoffs: [
      { from: 'CC05', to: 'SM01', purpose: '已受理委托转入样品接收' },
      { from: 'SM01', to: 'TM01', purpose: '样品接收完成后进入任务受理' },
    ],
    branches: [
      { from: 'CC07', when: '评审退回或要求补充', to: 'CC04' },
      { from: 'CC05', when: '客户要求发生变化', to: 'CC08' },
      { from: 'CC09', when: '沟通影响履约要求', to: 'CC08' },
    ],
  },
  {
    id: 'P02',
    title: '样品生命周期',
    module: '样品管理',
    responsibleRoles: '样品管理员、检测员、质量负责人、档案管理员',
    primaryPath: ['SM01', 'SM02', 'SM04', 'SM06', 'SM07', 'SM08', 'SM10', 'SM11', 'SM12'],
    terminal: 'SM12',
    entryPages: ['SM01', 'SM04'],
    detailPages: ['SM05'],
    editPages: ['SM02', 'SM06', 'SM07', 'SM08', 'SM09', 'SM10', 'SM11', 'SM12'],
    approvalPages: ['SM03', 'SM12'],
    handoffs: [
      { from: 'SM10', to: 'TM01', purpose: '样品领用完成后允许任务开工' },
      { from: 'TM14', to: 'RM07', purpose: '检测完成后确认留样或处置要求' },
    ],
    branches: [
      { from: 'SM02', when: '接收条件不满足', to: 'SM03' },
      { from: 'SM03', when: '有条件接收或补充证据完成', to: 'SM02' },
      { from: 'SM10', when: '检测结束归还', to: 'SM09' },
      { from: 'SM11', when: '留样需要延期', to: 'SM09' },
    ],
  },
  {
    id: 'P03',
    title: '检测执行与结果放行',
    module: '检测管理',
    responsibleRoles: '任务管理员、检测员、技术负责人、复核人、质量控制人员',
    primaryPath: ['TM01', 'TM02', 'TM03', 'TM04', 'TM05', 'TM07', 'TM08', 'TM11', 'TM13', 'TM12', 'TM14', 'RM01'],
    terminal: 'RM01',
    entryPages: ['TM01'],
    detailPages: ['TM03', 'TM11'],
    editPages: ['TM02', 'TM04', 'TM05', 'TM06', 'TM07', 'TM08'],
    approvalPages: ['TM10', 'TM12', 'TM13', 'TM14'],
    handoffs: [
      { from: 'TM14', to: 'RM01', purpose: '任务完成和结果放行后进入报告编制队列' },
    ],
    branches: [
      { from: 'TM05', when: '导入仪器原始文件', to: 'TM06' },
      { from: 'TM05', when: '发现偏离或异常', to: 'TM09' },
      { from: 'TM09', when: '满足恢复条件', to: 'TM05' },
      { from: 'TM09', when: '需要复检或重测', to: 'TM10' },
      { from: 'TM10', when: '批准重测并生成关联任务', to: 'TM02' },
      { from: 'TM12', when: '复核退回补充', to: 'TM11' },
    ],
  },
  {
    id: 'P04',
    title: '报告编制、发布与归档',
    module: '报告管理',
    responsibleRoles: '报告编制人、报告审核人、授权签字人、交付人员与档案管理员',
    primaryPath: ['RM01', 'RM02', 'RM03', 'RM04', 'RM06', 'RM05', 'RM07', 'RM08', 'RM11'],
    terminal: 'RM11',
    entryPages: ['RM01'],
    detailPages: ['RM08'],
    editPages: ['RM02', 'RM03', 'RM09', 'RM10'],
    approvalPages: ['RM04', 'RM05', 'RM06'],
    handoffs: [
      { from: 'TM14', to: 'RM01', purpose: '已完成检测任务交接报告编制' },
      { from: 'RM07', to: 'SM11', purpose: '报告发布后交接留样期限管理' },
      { from: 'RM08', to: 'RM11', purpose: '有效报告转入受控归档与调阅' },
    ],
    branches: [
      { from: 'RM03', when: '完整性检查未通过', to: 'RM02' },
      { from: 'RM04', when: '审核退回补充', to: 'RM02' },
      { from: 'RM05', when: '签发退回补充', to: 'RM02' },
      { from: 'RM07', when: '送达失败需要重试', to: 'RM07' },
      { from: 'RM08', when: '发起报告更正', to: 'RM09' },
      { from: 'RM08', when: '发起报告撤回或作废', to: 'RM10' },
      { from: 'RM09', when: '新版本重新履行审核与签发', to: 'RM03' },
    ],
  },
];

// 根据页面 ID 查找其所属流程
export function findFlowByPage(pageId) {
  for (const flow of FlowCatalog) {
    if (flow.primaryPath.includes(pageId) || flow.branches.some((b) => b.from === pageId || b.to === pageId)) {
      return flow;
    }
  }
  return null;
}

// 根据页面 ID 获取在该流程中的步骤索引（1-based）
export function getStepIndex(pageId) {
  const flow = findFlowByPage(pageId);
  if (!flow) return { flow: null, index: 0, total: 0 };
  const idx = flow.primaryPath.indexOf(pageId);
  return { flow, index: idx + 1, total: flow.primaryPath.length };
}
