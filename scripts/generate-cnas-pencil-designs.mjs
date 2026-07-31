import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { businessDomains } from './cnas-page-specs-business.mjs';
import { resourceDomains } from './cnas-page-specs-resources.mjs';
import { governanceDomains } from './cnas-page-specs-governance.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const DESIGN_DIR = join(ROOT, 'design');
const PENCIL_TEMPLATE_NAME = process.env.CNAS_PENCIL_TEMPLATE;
if (PENCIL_TEMPLATE_NAME && !/^\.cnas-(?:runtime|template)-[\w-]+\.pen$/.test(PENCIL_TEMPLATE_NAME)) {
  throw new Error('CNAS_PENCIL_TEMPLATE 仅允许项目 design 目录下的临时 .cnas-runtime-*.pen 或 .cnas-template-*.pen 文件。');
}
const TEMPLATE = join(DESIGN_DIR, PENCIL_TEMPLATE_NAME ?? `.cnas-runtime-${process.pid}.pen`);
const PENCIL = join(process.env.APPDATA, 'npm', 'node_modules', '@pen.dev', 'cli', 'dist', 'index.mjs');
const require = createRequire(import.meta.url);
const sharp = require(join(process.env.APPDATA, 'npm', 'node_modules', '@pen.dev', 'cli', 'node_modules', 'sharp'));
const ANSI_RE = /\x1b\[[0-9;]*m/g;

const legacyDomains = [
  {
    basename: 'cnas-01-foundation-workbench',
    pages: [
      ['A01', '登录', '全部用户', 'login', '安全登录与演示环境识别', '账号密码|验证码|记住账号|登录失败'],
      ['A02', '综合工作台', '实验室主任 / 质量负责人', 'dashboard', '业务、质量、资源与认可总览', '待办任务|样品进度|质量风险|资源预警'],
      ['A03', '统一待办与消息', '全部用户', 'list', '集中处理审批、任务、预警与通知', '待办编号|类型|来源|优先级|到期时间|状态'],
      ['A04', '全局搜索', '全部用户', 'search', '跨客户、样品、任务、报告与文件检索', '分类|业务编号|摘要|更新时间|权限状态'],
      ['A05', '个人工作中心', '全部用户', 'profile', '个人任务、授权、培训与签名状态', '个人待办|岗位授权|培训计划|签名状态'],
      ['A06', '导航与权限场景', '系统管理员 / 评审人员', 'permission', '菜单、按钮、数据范围与只读模式', '功能权限|数据范围|流程权限|技术授权'],
      ['A07', '通用状态样板', '产品与开发团队', 'states', '统一加载、空态、错误、禁用与长文本表现', '加载中|空结果|服务错误|权限拒绝|长文本'],
      ['M01', '移动工作台', '检测员 / 管理人员', 'mobile', '移动待办、任务与关键预警', '今日任务|待审批|风险预警|快捷入口'],
      ['M02', '移动待办审批', '审核人 / 授权签字人', 'mobileApproval', '移动审批摘要、意见与留痕', '审批摘要|核验清单|历史意见|签名确认'],
    ],
  },
  {
    basename: 'cnas-02-business-chain',
    pages: [
      ['B01', '客户台账', '业务受理人员', 'listDrawer', '客户、联系人、协议与历史委托', '客户编号|客户名称|联系人|信用状态|最近委托|状态'],
      ['B02', '委托列表', '业务受理人员 / 技术负责人', 'list', '委托状态、时限与评审进度', '委托编号|客户|样品数|期望日期|评审进度|状态'],
      ['B03', '新建委托向导', '业务受理人员', 'form', '客户、样品、项目、交付与特殊要求', '客户信息|样品信息|检测项目|交付要求'],
      ['B04', '合同评审', '技术负责人 / 质量负责人', 'review', '能力范围、方法、资源、周期与分包评审', '能力范围|方法有效性|资源可用性|分包安排|判定规则'],
      ['B05', '样品接收工作台', '样品管理员', 'receive', '核对委托、包装、条件并打印标签', '委托编号|样品名称|数量|包装状态|接收条件|标签'],
      ['B06', '样品异常确认', '样品管理员 / 客户联系人', 'exception', '破损、标识不清、数量不符与条件偏离', '异常类型|现场照片|影响说明|客户确认|处置结论'],
      ['B07', '样品台账与追踪', '样品管理员 / 检测员', 'trace', '样品、子样、位置、交接与任务关系', '样品编号|子样|当前位置|保管条件|关联任务|状态'],
      ['B08', '留样与处置', '样品管理员', 'list', '留样到期、归还、销毁与延期', '样品编号|留样位置|到期日|处置方式|审批状态|状态'],
      ['B09', '任务列表与排程', '任务管理员 / 技术负责人', 'schedule', '按人员、设备与计划组织检测任务', '任务编号|项目|执行人|设备|计划时间|冲突状态'],
      ['B10', '任务详情与进度', '检测员 / 审核人员', 'detail', '任务上下文、步骤、依赖与执行时间线', '任务信息|执行步骤|资源状态|依赖任务|暂停原因'],
      ['B11', '原始记录编辑器', '检测员', 'record', '关联方法、设备、环境与物料填写原始记录', '检测项目|原始读数|单位|自动计算|设备|环境'],
      ['B12', '仪器数据导入与对账', '检测员 / 数据审核员', 'import', '匹配仪器文件、样品和结果并处理差异', '文件名|仪器|样品映射|结果数量|差异|导入状态'],
      ['B13', '结果审核工作台', '结果审核人员', 'review', '复核完整性、计算、异常值与历史版本', '样品编号|检测项目|结果|异常标记|版本|审核状态'],
      ['B14', '报告列表', '报告人员 / 授权签字人', 'list', '报告签发、送达、更正与下载权限', '报告编号|客户|委托编号|版本|签发人|状态'],
      ['B15', '报告编制与预览', '报告编制人员', 'report', '组织结果、判定和附件并实时预览', '报告基本信息|检测结果|判定结论|附件|模板版本'],
      ['B16', '报告审核与签发', '报告审核人 / 授权签字人', 'approval', '核验授权范围、认可标识与电子签名', '完整性|授权范围|认可标识|签名确认|发布方式'],
      ['B17', '报告更正与撤回', '授权签字人 / 质量负责人', 'version', '记录原因、影响、客户通知与版本关系', '原报告|更正原因|影响范围|客户通知|新版本'],
      ['M03', '移动扫码接收与交接', '样品管理员', 'mobileScan', '扫码接收、位置确认与交接', '扫码结果|样品摘要|接收条件|交接确认'],
      ['M04', '移动任务执行与记录', '检测员', 'mobileTask', '查看步骤、录入关键结果并上传附件', '任务步骤|关键结果|附件|离线状态'],
      ['M05', '移动报告审批签名', '授权签字人', 'mobileApproval', '查看报告摘要、核验并完成签发', '报告摘要|风险提示|核验清单|签名确认'],
    ],
  },
  {
    basename: 'cnas-03-resources-quality',
    pages: [
      ['R01', '人员档案', '人员管理员 / 技术负责人', 'listDrawer', '资格、经历、培训与授权时间线', '人员编号|姓名|岗位|专业组|授权状态|培训状态'],
      ['R02', '培训计划与执行', '培训管理员 / 参训人员', 'schedule', '制定计划、签到、考核与培训评价', '培训主题|对象|计划日期|签到率|考核结果|状态'],
      ['R03', '能力评价与授权矩阵', '技术负责人', 'matrix', '人员、项目、方法、设备与场所授权', '人员|检测项目|方法|设备|场所|授权状态'],
      ['R04', '方法与标准台账', '技术负责人 / 文件管理员', 'listDrawer', '方法版本、适用范围与标准查新', '方法编号|名称|版本|适用范围|查新日期|状态'],
      ['R05', '方法验证/确认项目', '技术负责人 / 检测员', 'form', '方案、实验数据、评价与批准', '项目编号|方法|验证类型|负责人|进度|审批状态'],
      ['R06', '测量不确定度与判定规则', '技术负责人', 'version', '模型、分量、版本与规则适用范围', '模型名称|适用项目|主要分量|版本|发布日期|状态'],
      ['R07', '设备台账', '设备管理员 / 使用人员', 'listDrawer', '设备状态、位置、证书与生命周期', '设备编号|设备名称|位置|校准有效期|责任人|状态'],
      ['R08', '设备计划日历', '设备管理员', 'schedule', '校准、检定、维护与期间核查计划', '计划类型|设备|计划日期|责任人|完成日期|状态'],
      ['R09', '设备验收与异常影响', '设备管理员 / 技术负责人', 'exception', '验收不合格、故障、失效与结果影响', '设备信息|异常类型|影响时段|关联任务|处置|CAPA'],
      ['R10', '标准物质/试剂耗材库存', '物料管理员', 'listDrawer', '品种、批次、证书、位置与库存', '物料编码|名称|批次|库存量|有效期|状态'],
      ['R11', '入库验证与扫码出库', '物料管理员 / 领用人员', 'receive', '批次验收、入库、领用、退库与调整', '物料信息|批次|验收项目|数量|库位|经办人'],
      ['R12', '库存与临期预警', '物料管理员 / 采购人员', 'monitor', '库存下限、临期、过期与召回', '预警类型|物料|批次|当前库存|有效期|处置状态'],
      ['R13', '设施环境监控', '设施管理员 / 质量负责人', 'monitor', '区域、监测点、实时值与趋势', '监测点|温度|湿度|阈值|在线状态|更新时间'],
      ['R14', '环境异常与影响评价', '设施管理员 / 质量负责人', 'exception', '确认报警、处置失控并评价关联任务', '报警点位|异常时段|最大偏差|关联任务|恢复状态|CAPA'],
      ['R15', '供应商/采购/分包', '采购人员 / 技术负责人', 'listDrawer', '供方准入、采购验收、评价与分包评审', '供应商|服务类别|准入状态|年度评分|客户同意|状态'],
      ['R16', '质量控制', '质量负责人 / 检测员', 'qualityChart', '质控计划、质控样与趋势判定', '项目|批次|均值|标准差|规则判定|状态'],
      ['R17', '能力验证/实验室间比对', '质量负责人 / 技术负责人', 'detail', '计划、报名、实施、结果评价与处置', '项目编号|组织方|实施时间|结果评价|影响范围|状态'],
      ['R18', '质量事件、CAPA 与风险', '质量负责人 / 责任部门', 'capa', '投诉、不符合、风险、措施与有效性验证', '事件编号|来源|严重度|责任部门|截止日期|状态'],
      ['M06', '移动设备与物料扫码', '设备/物料管理员', 'mobileScan', '扫码巡检、领用与异常上报', '对象摘要|当前状态|快捷动作|异常照片'],
    ],
  },
  {
    basename: 'cnas-04-governance-accreditation',
    pages: [
      ['G01', '受控文件库', '文件管理员 / 全体人员', 'listDrawer', '内部/外来文件、版本与受控下载', '文件编号|文件名称|类型|版本|适用范围|状态'],
      ['G02', '文件修订与审批', '编制人 / 审核人 / 批准人', 'version', '编制、修订、审核、批准、发布与作废', '修订申请|版本对比|审核意见|批准确认|发布范围'],
      ['G03', '记录档案与借阅销毁', '档案管理员', 'list', '归档、保存期、借阅、归还与销毁审批', '档案编号|记录类型|归档日期|保存期限|借阅状态|销毁状态'],
      ['G04', '内部审核计划与执行', '内审责任人 / 内审员', 'audit', '审核策划、检查表、证据与结论', '审核编号|范围|审核组|检查项|证据|进度'],
      ['G05', '审核发现与整改', '内审员 / 责任部门 / 验证人', 'capa', '不符合、观察项、整改与有效性验证', '发现编号|严重度|责任部门|截止日期|CAPA|状态'],
      ['G06', '管理评审', '最高管理者 / 质量负责人', 'review', '评审输入、会议决定与措施跟踪', '评审输入|材料进度|会议议程|输出决定|跟踪措施'],
      ['G07', '认可范围与授权签字人', '认可管理员 / 技术负责人', 'matrix', '场所、对象、项目、方法与签字授权', '场所|对象|项目参数|方法|签字人|有效状态'],
      ['G08', '条款自查与证据矩阵', '质量负责人 / 自查人员', 'matrix', '责任分配、符合性评价与证据缺口', '要求项|责任人|符合性|证据数量|缺口|状态'],
      ['G09', 'CNAS 评审项目与整改', '认可管理员 / 责任部门', 'capa', '评审准备、问题整改、验证与证据提交', '项目编号|评审类型|问题项|责任部门|截止日期|状态'],
      ['G10', '组织、用户与角色', '系统管理员 / 管理人员', 'permission', '组织岗位、用户状态、角色与兼岗关系', '用户|组织|岗位|角色|数据范围|状态'],
      ['G11', '权限矩阵与审计日志', '系统管理员 / 审计人员', 'auditLog', '功能、数据、流程、技术授权与关键日志', '时间|主体|对象|动作|理由|结果'],
      ['G12', '平台配置与接口监控', '系统管理员 / 运维人员', 'monitor', '工作流、编号、模板、消息与接口状态', '接口名称|方向|最后同步|耗时|重试次数|状态'],
    ],
  },
];

const domains = [...businessDomains, ...resourceDomains, ...governanceDomains].map((domain) => ({
  ...domain,
  pages: domain.pages.map((page) => ({ ...page, root: domain.root })),
}));

const flowCatalog = [
  { id: 'P01', title: '客户委托到任务受理', owner: 'cnas-02-customer-commission', roles: '受理、技术、质量、样品与任务责任人', nodes: ['CC04', 'CC06', 'CC07', 'CC05', 'SM01', 'TM01'], terminal: 'TM01', blocked: 'CC04', summary: '客户要求确认、合同评审、样品接收与任务受理形成可追溯主链。' },
  { id: 'P02', title: '样品接收到样品处置', owner: 'cnas-03-sample-management', roles: '样品管理员、检测员与档案管理员', nodes: ['SM01', 'SM02', 'SM04', 'SM06', 'SM07', 'SM08', 'SM10', 'SM11', 'SM12'], terminal: 'SM12', blocked: 'SM03', summary: '从到样核验、标识、流转、留样到受控处置的样品全生命周期。' },
  { id: 'P03', title: '检测任务分配到结果审核', owner: 'cnas-04-testing-management', roles: '任务管理员、检测员、复核人与审核人', nodes: ['TM01', 'TM02', 'TM03', 'TM04', 'TM05', 'TM07', 'TM08', 'TM11', 'TM12', 'TM13', 'TM14'], terminal: 'TM14', blocked: 'TM09', summary: '资源校验、原始记录、结果汇总、复核与审核的受控检测执行链。' },
  { id: 'P04', title: '原始记录到报告发布', owner: 'cnas-05-report-management', roles: '检测员、报告编制人、审核人、签字人与交付人员', nodes: ['TM14', 'RM01', 'RM02', 'RM03', 'RM04', 'RM05', 'RM07', 'RM08'], terminal: 'RM08', blocked: 'RM02', summary: '已审核结果引用、报告编制、审核签发、发布送达与档案查询闭环。' },
  { id: 'P05', title: '人员培训到岗位授权', owner: 'cnas-06-resource-management', roles: '人员管理员、培训管理员、技术负责人', nodes: ['R01', 'R02', 'R03', 'R04', 'R05', 'R06'], terminal: 'R06', blocked: 'R05', summary: '资格证据、培训考核、能力评价和授权生效、复评或暂停全程受控。' },
  { id: 'P06', title: '设备采购到报废', owner: 'cnas-06-resource-management', roles: '采购、设备、技术与质量责任人', nodes: ['R22', 'R23', 'R24', 'R11', 'R12', 'R13', 'R14'], terminal: 'R14', blocked: 'R24', summary: '采购验收、建档、使用维护、失效影响评价、恢复或报废的设备生命周期。' },
  { id: 'P07', title: '文件修订到作废归档', owner: 'cnas-08-governance-management', roles: '文件编制人、审核人、批准人、文件管理员与使用岗位', nodes: ['GOV01', 'GOV02', 'GOV03', 'GOV04', 'GOV04-EXEC', 'GOV06', 'GOV08'], terminal: 'GOV08', blocked: 'GOV02', summary: '修订申请、审核批准、发布分发、签收执行、作废回收和归档的文件受控闭环。' },
  { id: 'P08', title: '不符合项发现到整改关闭', owner: 'cnas-07-quality-management', roles: '质量负责人、责任部门与独立验证人', nodes: ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'], terminal: 'Q10', blocked: 'Q08', summary: '事件或不符合识别、即时控制、根因、措施、独立有效性验证和关闭。' },
  { id: 'P09', title: '内审到整改验证', owner: 'cnas-08-governance-management', roles: '内审负责人、审核员、责任部门与验证人', nodes: ['GOV10', 'GOV11', 'GOV12'], terminal: 'GOV12', blocked: 'GOV11', summary: '内部审核计划、证据执行、发现整改与独立验证的闭环。' },
  { id: 'P10', title: '管理评审到改进闭环', owner: 'cnas-08-governance-management', roles: '最高管理者、质量负责人和措施责任人', nodes: ['GOV13', 'GOV14', 'GOV15'], terminal: 'GOV15', blocked: 'GOV14', summary: '输入收集、管理决策、措施执行、有效性确认和持续改进。' },
  { id: 'P11', title: '能力验证计划到结果评价', owner: 'cnas-07-quality-management', roles: '质量负责人、技术负责人和项目执行人', nodes: ['Q04', 'Q05', 'Q09', 'Q10'], terminal: 'Q10', blocked: 'Q05', summary: '年度计划、项目实施、结果评价；不满意结果进入 CAPA 并完成验证。' },
  { id: 'P12', title: 'CNAS 评审问题到整改完成', owner: 'cnas-09-accreditation-management', roles: '认可管理员、条款责任人、责任部门与内部验证人', nodes: ['ACC01', 'ACC02', 'ACC04', 'ACC05', 'ACC06', 'ACC07', 'ACC08'], terminal: 'ACC08', blocked: 'ACC07', summary: '认可项目、范围版本、条款自查、证据包、迎审、整改提交、补充与证书/范围归档。' },
];

const pageById = new Map(domains.flatMap((domain) => domain.pages).map((page) => [page.id, page]));

function flowContextsForPage(page) {
  const anchorId = page.flowAnchorPageId || page.sourcePageId || page.id;
  return flowCatalog
    .filter((flow) => flow.nodes.includes(anchorId))
    .map((flow) => {
      const nodeIndex = flow.nodes.indexOf(anchorId) + 1;
      return {
        flowId: flow.id,
        flowTitle: flow.title,
        steps: flow.nodes.map((pageId) => pageById.get(pageId)?.flowNode || pageById.get(pageId)?.title || pageId),
        nodeIndex,
        nodeCount: flow.nodes.length,
        nodeState: flow.terminal === anchorId ? 'terminal' : 'current',
        normalNext: page.primaryNext,
        returnTarget: page.returnTarget,
        blockedTarget: page.alternatePaths?.find((path) => /阻断|未完成|退回|缺失/.test(path.action || path.label || ''))?.target || page.id,
      };
    });
}

for (const domain of domains) {
  for (const page of domain.pages) {
    const derivedContexts = flowContextsForPage(page);
    const existingContexts = page.flowContexts || (page.flowContext ? [page.flowContext] : []);
    const contextsById = new Map(existingContexts.filter((context) => context?.flowId).map((context) => [context.flowId, context]));
    for (const context of derivedContexts) {
      contextsById.set(context.flowId, { ...contextsById.get(context.flowId), ...context });
    }
    page.flowContexts = [...contextsById.values()];
    page.primaryFlowId ||= page.flowContext?.flowId || page.flowIds?.find((flowId) => flowCatalog.some((flow) => flow.id === flowId)) || page.flowContexts[0]?.flowId || null;
    page.flowContext = page.flowContexts.find((context) => context.flowId === page.primaryFlowId) || page.flowContexts[0] || null;
    for (const context of page.flowContexts) {
      context.normalNext ||= page.primaryNext || page.id;
      context.returnTarget ||= page.returnTarget || page.id;
      context.blockedTarget ||= page.id;
      context.nodeState ||= context.terminal ? 'terminal' : 'current';
      context.nodeIndex ||= context.currentStep || 1;
      context.nodeCount ||= context.stepCount || context.steps?.length || 1;
    }
  }
}

function flowBoardsForDomain(domain) {
  const related = flowCatalog.filter((flow) => flow.nodes.some((pageId) => pageById.get(pageId)?.root === domain.root));
  const owned = related.filter((flow) => flow.owner === domain.basename);
  return [
    { type: 'center', id: `FLOW-${domain.basename}`, title: `${domain.root}流程中心`, name: `Flow Center / ${domain.root}`, root: domain.root, flows: related },
    ...owned.map((flow) => ({
      type: 'overview',
      ...flow,
      summary: flow.id === 'P07'
        ? `${flow.summary} 状态：草稿、待审核、退回、待批准、待发布、待生效、有效、修订中、待作废、回收中、作废、已归档；签收未完成阻断归档。`
        : flow.summary,
      name: `Flow Overview / ${flow.id} / ${flow.title}`,
      root: domain.root,
    })),
  ];
}

function generationOptionsForDomain(domain) {
  return {
    flowBoards: flowBoardsForDomain(domain),
    stateBoards: actionStateBoardsForDomain(domain),
  };
}
const navigationModel = domains.map((domain) => ({
  root: domain.root,
  children: [...new Set(domain.pages.filter((page) => !page.hidden && !page.id.startsWith('M') && page.kind !== 'login').map((page) => page.menu))],
}));

const INTERACTION_PROFILE_VERSION = 1;
const INTERACTION_PROFILE_SECTIONS = ['edit', 'detail', 'modal', 'blocker', 'success', 'flow', 'audit'];

function interactionFlowSteps(page) {
  const value = Array.isArray(page.flow) ? page.flow : String(page.flow || '提交申请 → 核验条件 → 处理事项 → 完成').split('→');
  return value.map((step) => String(step).trim()).filter(Boolean).slice(0, 5);
}

function interactionProfileDefaults(page) {
  const family = page.renderFamily || '';
  const kind = page.kind || '';
  const editable = !['login', 'dashboard', 'search', 'states', 'auditLog', 'qualityChart'].includes(kind)
    || ['approval', 'workflow', 'verification', 'lifecycle'].includes(family);
  const lifecycle = ['version', 'versionDetail', 'correction', 'withdrawal'].includes(kind) || family === 'lifecycle';
  const steps = interactionFlowSteps(page);
  return {
    version: INTERACTION_PROFILE_VERSION,
    source: 'derived',
    edit: {
      enabled: editable,
      mode: lifecycle ? 'version' : ['form', 'wizard', 'record', 'receive', 'exception', 'capa'].includes(kind) ? 'form' : 'inline-or-drawer',
      fields: (page.fields || []).slice(0, 4),
      validation: ['必填项完整', '业务状态允许当前操作', '关联证据与资源可用'],
      actions: ['保存草稿', '提交审核'],
    },
    detail: {
      enabled: kind !== 'login',
      mode: lifecycle ? 'version-drawer' : 'detail-drawer',
      sections: ['基本信息', '关联业务', '当前状态'],
      entry: '查看详情',
    },
    modal: {
      enabled: editable,
      variant: lifecycle ? 'warning' : 'standard',
      title: lifecycle ? '确认变更版本状态' : '确认提交当前变更',
      action: lifecycle ? '确认状态变更' : '确认提交',
      content: '提交后将进入受控流程，并保留操作原因与审计留痕。',
    },
    blocker: {
      enabled: true,
      state: 'blocked',
      reasons: ['当前账号无流程权限', '必填项或关键证据缺失', '关联资源状态不满足'],
      action: '保存草稿或返回处理',
    },
    success: {
      enabled: editable,
      tone: 'success',
      title: '操作成功',
      message: '变更已保存并记录审计，流程已进入下一节点。',
    },
    flow: {
      enabled: steps.length > 0,
      steps,
      currentStep: steps.length ? 1 : 0,
      pending: steps.at(-1) || '等待下一节点',
    },
    audit: {
      enabled: true,
      events: ['打开页面 · 当前用户', '保存草稿 · 已记录', '提交变更 · 等待下一节点'],
      actor: '当前用户',
    },
  };
}

function mergeInteractionProfile(page) {
  const defaults = interactionProfileDefaults(page);
  const provided = page.interactionProfile && typeof page.interactionProfile === 'object' ? page.interactionProfile : {};
  const profile = { ...defaults, ...provided, version: INTERACTION_PROFILE_VERSION };
  for (const section of INTERACTION_PROFILE_SECTIONS) {
    const override = provided[section];
    if (override && typeof override === 'object' && !Array.isArray(override)) {
      profile[section] = { ...defaults[section], ...override };
    }
  }
  profile.source = provided.source || (Object.keys(provided).length ? 'spec' : 'derived');
  return profile;
}

function interactionBoardName(pages) {
  const root = pages.find((page) => page.root)?.root || 'CNAS';
  return `Interaction State Board / ${root}`;
}

function interactionBoardSpec(pages) {
  const representative = pages.find((page) => !page.id.startsWith('M') && page.kind !== 'login') || pages[0];
  return {
    name: interactionBoardName(pages),
    root: representative?.root || 'CNAS',
    title: `${representative?.root || 'CNAS'} 交互状态板`,
    referencePage: representative?.title || '模块业务页面',
    profile: representative?.interactionProfile || mergeInteractionProfile(representative || {}),
  };
}

function actionStateBoardsForDomain(domain) {
  const byId = new Map();
  for (const page of domain.pages) {
    for (const action of page.actionContracts ?? []) {
      if (!['drawer', 'modal'].includes(action.surface) || byId.has(action.variantFrameId)) continue;
      byId.set(action.variantFrameId, {
        id: action.variantFrameId,
        name: `State/${action.variantFrameId}`,
        title: `${page.id} · ${action.label}`,
        root: domain.root,
        sourcePageId: page.id,
        sourcePageTitle: page.title,
        action,
      });
    }
  }
  return [...byId.values()];
}

function contactSheetPages(pages, includeInteractionBoard = false, flowBoards = [], stateBoards = []) {
  const pageItems = pages.map((page) => ({
    ...page,
    width: page.id.startsWith('M') ? 390 : 1440,
    height: page.id.startsWith('M') ? 844 : 900,
    isMobile: page.id.startsWith('M'),
  }));
  const boards = flowBoards.map((flowBoard) => ({
    id: flowBoard.id,
    title: flowBoard.name,
    isFlowBoard: true,
    flowBoard,
    width: 1440,
    height: 900,
  }));
  const states = stateBoards.map((stateBoard) => ({
    id: `__state__${stateBoard.id}`,
    title: stateBoard.name,
    isStateBoard: true,
    stateBoard,
    width: 1440,
    height: 900,
  }));
  return includeInteractionBoard
    ? [...pageItems, ...states, ...boards, { id: '__interaction__', title: interactionBoardName(pages), isInteractionBoard: true, width: 1440, height: 900 }]
    : [...pageItems, ...states, ...boards];
}

for (const domain of domains) {
  for (const page of domain.pages) page.interactionProfile = mergeInteractionProfile(page);
}

const forbiddenVisibleTerms = ['当前模块', '演示数据', '演示环境', '全部用户', 'DEMO', '（演示）'];

const coreExamplePages = [
  { id: 'CE01', title: '综合工作台', root: '工作台', menu: '综合工作台', role: '实验室主任 / 质量负责人', kind: 'dashboard', pageType: '入口页', goal: '汇总业务进度、质量风险、资源状态与待办事项', fields: ['统计范围', '待办数量', '报告时效', '资源预警'], entry: '登录成功后默认进入', back: '退出登录后返回登录页' },
  { id: 'CE02', title: '委托列表', root: '客户与委托', menu: '委托管理', role: '业务受理人员 / 技术负责人', kind: 'list', pageType: '入口页', goal: '按客户、状态和时限追踪候选委托', fields: ['委托编号', '客户名称', '业务类型', '评审状态'], entry: '从客户与委托一级菜单进入', back: '返回综合工作台' },
  { id: 'CE03', title: '样品接收', root: '样品管理', menu: '样品接收', role: '样品管理员', kind: 'receive', pageType: '操作页', goal: '核对样品条件、唯一标识和入库位置', fields: ['委托编号', '样品名称', '包装状态', '接收条件'], entry: '从委托详情进入', back: '返回委托详情并保留上下文' },
  { id: 'CE04', title: '检测任务', root: '检测管理', menu: '任务管理', role: '任务管理员 / 检测员', kind: 'detail', pageType: '入口页', goal: '查看检测步骤、资源校验和执行进度', fields: ['任务编号', '检测项目', '执行人员', '资源状态'], entry: '从工作台任务指标进入', back: '返回任务列表' },
  { id: 'CE05', title: '报告审核与签发', root: '报告管理', menu: '报告审核', role: '报告审核人 / 授权签字人', kind: 'approval', pageType: '操作页', goal: '核验报告完整性、授权范围和签发条件', fields: ['报告编号', '审核状态', '授权范围', '签名确认'], entry: '从报告列表或待办进入', back: '返回报告列表或我的待办' },
  { id: 'CE06', title: '设备台账', root: '资源管理', menu: '设备管理', role: '设备管理员 / 技术负责人', kind: 'listDrawer', pageType: '入口页', goal: '维护设备状态、校准有效期和关联任务', fields: ['设备编号', '设备名称', '校准有效期', '责任人'], entry: '从资源管理一级菜单进入', back: '返回综合工作台' },
  { id: 'CE07', title: 'CAPA 处置', root: '质量管理', menu: 'CAPA', role: '质量负责人 / 责任部门', kind: 'capa', pageType: '操作页', goal: '完成不符合影响评价、措施验证与关闭', fields: ['事件编号', '严重度', '影响范围', '关闭条件'], entry: '从质量事件或待办进入', back: '返回质量事件列表' },
  { id: 'CE08', title: '内部审核', root: '体系管理', menu: '内部审核', role: '内审责任人 / 内审员', kind: 'audit', pageType: '入口页', goal: '执行检查表、上传证据并形成审核结论', fields: ['审核编号', '审核范围', '审核组', '证据进度'], entry: '从体系管理一级菜单进入', back: '返回审核计划' },
  { id: 'CE09', title: '认可范围与授权签字人', root: '认可管理', menu: '认可范围', role: '认可管理员 / 技术负责人', kind: 'matrix', pageType: '入口页', goal: '核对场所、项目、方法与授权签字人关系', fields: ['场所', '检测项目', '方法版本', '签字人状态'], entry: '从认可管理一级菜单进入', back: '返回认可管理工作台' },
  { id: 'CE10', title: '权限矩阵与审计日志', root: '系统管理', menu: '权限管理', role: '系统管理员 / 审计人员', kind: 'permission', pageType: '入口页', goal: '维护功能、数据和流程权限并检查职责分离', fields: ['组织范围', '功能权限', '数据范围', '流程权限'], entry: '从系统管理一级菜单进入', back: '返回系统管理工作台' },
];

function pencilString(value) {
  return JSON.stringify(value);
}

async function runInteractiveOnce({ input, output, commands, timeoutMs = 900_000 }) {
  await mkdir(dirname(output), { recursive: true });
  const args = ['interactive'];
  if (input) args.push('--in', input);
  args.push('--out', output);

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [PENCIL, ...args], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });
    let raw = '';
    let sent = 0;
    let promptCount = 0;
    let settled = false;
    let timer;

    const fail = (message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      rejectPromise(new Error(`${message}\n${raw.slice(-50000)}`));
    };

    const armTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => fail(`Pencil command timed out: ${output}`), timeoutMs);
    };

    const consume = (chunk) => {
      raw += chunk.toString();
      const clean = raw.replace(ANSI_RE, '');
      const count = (clean.match(/(?:pen|pencil)\s*>/g) || []).length;
      if (count <= promptCount) return;
      promptCount = count;
      if (sent >= commands.length) return;
      let nextCommand;
      try {
        nextCommand = typeof commands[sent] === 'function' ? commands[sent](raw) : commands[sent];
      } catch (error) {
        fail(`Failed to build Pencil command: ${error.message}`);
        return;
      }
      child.stdin.write(`${nextCommand}\n`);
      sent += 1;
      armTimeout();
    };

    child.stdout.on('data', consume);
    child.stderr.on('data', consume);
    child.on('error', (error) => fail(`Failed to start Pencil CLI: ${error.message}`));
    child.on('close', async (code) => {
      clearTimeout(timer);
      if (settled) return;
      if (raw.includes('Failure during operation execution') || raw.includes('tool call failed')) {
        fail(`Pencil reported a design operation failure for ${output}`);
        return;
      }
      if (!existsSync(output)) {
        fail(`Pencil exited ${code} without saving ${output}`);
        return;
      }
      settled = true;
      const fileStat = await stat(output);
      if (fileStat.size < 256) {
        rejectPromise(new Error(`Saved Pencil file is unexpectedly small: ${output}\n${raw.slice(-5000)}`));
        return;
      }
      process.stdout.write(`Saved ${output} (${fileStat.size} bytes)\n`);
      resolvePromise(raw);
    });
    armTimeout();
  });
}

async function runInteractive(options) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await runInteractiveOnce(options);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 2000));
    }
  }
  throw lastError;
}

function templateOperations() {
  return String.raw`
SetVariables({
  "brand-primary":{type:"color",value:"#0F766E"},"brand-primary-dark":{type:"color",value:"#115E59"},
  "brand-primary-light-5":{type:"color",value:"#5EEAD4"},"brand-primary-light-8":{type:"color",value:"#CCFBF1"},
  "brand-primary-light-9":{type:"color",value:"#F0FDFA"},"brand-secondary":{type:"color",value:"#2563EB"},
  "semantic-success":{type:"color",value:"#67C23A"},"semantic-success-bg":{type:"color",value:"#F0F9EB"},
  "semantic-warning":{type:"color",value:"#E6A23C"},"semantic-danger":{type:"color",value:"#F56C6C"},
  "semantic-warning-bg":{type:"color",value:"#FDF6EC"},"semantic-danger-bg":{type:"color",value:"#FEF0F0"},
  "semantic-info":{type:"color",value:"#909399"},"semantic-info-bg":{type:"color",value:"#F4F4F5"},
  "surface-page":{type:"color",value:"#F2F3F5"},"surface-panel":{type:"color",value:"#FFFFFF"},
  "surface-muted":{type:"color",value:"#F0F2F5"},"surface-subtle":{type:"color",value:"#FAFCFC"},"surface-selected":{type:"color",value:"#E6FFFA"},"surface-skeleton":{type:"color",value:"#E9EEF2"},
  "text-primary":{type:"color",value:"#303133"},"text-regular":{type:"color",value:"#606266"},
  "text-secondary":{type:"color",value:"#909399"},"text-placeholder":{type:"color",value:"#A8ABB2"},
  "text-disabled":{type:"color",value:"#C0C4CC"},"text-on-brand":{type:"color",value:"#FFFFFF"},"text-warning":{type:"color",value:"#7A4C00"},"border-base":{type:"color",value:"#DCDFE6"},
  "border-light":{type:"color",value:"#EBEEF5"},"border-extra-light":{type:"color",value:"#F2F6FC"},
  "font-cn":{type:"string",value:"Microsoft YaHei"},"component-small":{type:"number",value:24},
  "component-default":{type:"number",value:32},"component-large":{type:"number",value:40},
  "space-1":{type:"number",value:4},"space-2":{type:"number",value:8},"space-3":{type:"number",value:12},
  "space-4":{type:"number",value:16},"space-5":{type:"number",value:24},"space-6":{type:"number",value:32},
  "font-size-caption":{type:"number",value:12},"font-size-body":{type:"number",value:14},"font-size-title":{type:"number",value:16},
  "line-height-row":{type:"number",value:44},"line-height-menu":{type:"number",value:28},"line-height-timeline":{type:"number",value:32},"line-height-step-label":{type:"number",value:16},"panel-footer-height":{type:"number",value:56},
  "card-padding":{type:"number",value:16},"card-min-height":{type:"number",value:160},"card-metric-height":{type:"number",value:116},
  "modal-width":{type:"number",value:480},"modal-padding":{type:"number",value:24},"notification-width":{type:"number",value:400},"notification-height":{type:"number",value:84},
  "elevation-card":{type:"number",value:1},"elevation-overlay":{type:"number",value:16},
  "radius-small":{type:"number",value:2},"radius-base":{type:"number",value:4},
  "radius-round":{type:"number",value:20},"radius-circle":{type:"number",value:100}
},true)
function Safe(c){let value=String(c);for(const pair of [["演示数据","业务数据"],["演示环境","需求评审环境"],["全部用户","已认证用户"],["（演示）",""],["DEMO","LAB"],["演示","业务"]])value=value.split(pair[0]).join(pair[1]);return value}
function T(p,n,c,x,y,w,s=14,color="$text-regular",weight="400",align="left",id=null){return Insert(p,{type:"text",name:n,content:Safe(c),x,y,width:w,height:Math.ceil(s*1.4),fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width-height",...(id?{id}:{})})}
function WrapT(p,n,c,x,y,w,h,s=14,color="$text-regular",weight="400",align="left",id=null){return Insert(p,{type:"text",name:n,content:Safe(c),x,y,width:w,height:h,fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width-height",...(id?{id}:{})})}
function Box(p,n,x,y,w,h,fill="$surface-panel",radius=6,stroke="$border-light",id=null){return Insert(p,{type:"frame",name:n,x,y,width:w,height:h,fill,cornerRadius:radius,stroke,strokeWidth:1,layout:"none",clip:true,...(id?{id}:{})})}
function Ico(p,n,icon,x,y,color="$text-secondary",size=16){return Insert(p,{type:"icon",name:n,library:"lucide",icon,x,y,width:size,height:size,fill:color})}
palette=Insert(document,{type:"frame",id:"componentsTokens",name:"__Internal Reusable Components",x:-10000,y:-10000,width:6120,height:620,fill:"$surface-page",layout:"none",clip:true,opacity:0,placeholder:true})
T(palette,"Design System Title","CNAS 实验室信息管理系统 · web-ele 设计基线",40,32,900,24,"$text-primary","700")
T(palette,"Design System Subtitle","华衡检测实验室 · Vben Admin 5.x + Element Plus · Microsoft YaHei",40,70,1000,14)
for(const [i,item] of [["主色","$brand-primary"],["辅助蓝","$brand-secondary"],["成功","$semantic-success"],["警告","$semantic-warning"],["危险","$semantic-danger"],["信息","$semantic-info"]].entries()){sw=Box(palette,"Token/"+item[0],40+i*176,112,160,76,"$surface-panel",6);Insert(sw,{type:"rectangle",name:"Swatch",x:12,y:12,width:40,height:40,fill:item[1],cornerRadius:4});T(sw,"Token Name",item[0],64,20,80,14,"$text-primary","600")}
primary=Box(palette,"Button/Primary",40,220,112,36,"$brand-primary",4,"$brand-primary","cmpButtonPrimary");Update(primary,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});primaryLabel=T(primary,"Label","主要操作",0,0,112,14,"#FFFFFF","600","center","cmpButtonPrimaryLabel");Update(primaryLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
secondary=Box(palette,"Button/Secondary",168,220,112,36,"$surface-panel",4,"$border-base","cmpButtonSecondary");Update(secondary,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});secondaryLabel=T(secondary,"Label","次要操作",0,0,112,14,"$text-regular","500","center","cmpButtonSecondaryLabel");Update(secondaryLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
danger=Box(palette,"Button/Danger",296,220,112,36,"$semantic-danger",4,"$semantic-danger","cmpButtonDanger");Update(danger,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});dangerLabel=T(danger,"Label","高风险操作",0,0,112,14,"#FFFFFF","600","center","cmpButtonDangerLabel");Update(dangerLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
input=Box(palette,"Form/Input",40,280,240,36,"$surface-panel",4,"$border-base","cmpFormInput");Update(input,{reusable:true});T(input,"Placeholder","请输入或选择",12,8,190,14,"$text-secondary","400","left","cmpFormInputValue")
for(const [i,item] of [["Tag/Success","合格","#F0F9EB","$semantic-success","cmpTagSuccess","cmpTagSuccessLabel"],["Tag/Warning","待处理","#FDF6EC","$semantic-warning","cmpTagWarning","cmpTagWarningLabel"],["Tag/Danger","已阻断","#FEF0F0","$semantic-danger","cmpTagDanger","cmpTagDangerLabel"],["Tag/Info","草稿","#F4F4F5","$semantic-info","cmpTagInfo","cmpTagInfoLabel"]].entries()){tag=Box(palette,item[0],320+i*96,280,80,28,item[2],4,item[3],item[4]);Update(tag,{reusable:true});T(tag,"Label",item[1],8,5,64,12,item[3],"600","center",item[5])}
alert=Box(palette,"Alert/Warning",40,340,760,48,"$semantic-warning-bg",4,"$semantic-warning","cmpAlertWarning");Update(alert,{reusable:true});Ico(alert,"Icon","triangle-alert",14,15,"$semantic-warning",18);T(alert,"Message","检测资源或授权不满足时阻断流程，并保留处理路径与审计记录。",44,13,690,14,"$text-warning","500","left","cmpAlertWarningMessage")
compactAlert=Box(palette,"Alert/Warning/Compact",816,340,360,60,"$semantic-warning-bg",4,"$semantic-warning","cmpAlertWarningCompact");Update(compactAlert,{reusable:true});Ico(compactAlert,"Icon","triangle-alert",14,20,"$semantic-warning",18);WrapT(compactAlert,"Message","窄宽区域的风险提示保留完整恢复路径。",44,12,298,36,13,"$text-warning","500","left","cmpAlertWarningCompactMessage")
dangerAlert=Box(palette,"Alert/Danger",1192,340,360,48,"$semantic-danger-bg",4,"$semantic-danger","cmpAlertDanger");Update(dangerAlert,{reusable:true});Ico(dangerAlert,"Icon","octagon-alert",14,15,"$semantic-danger",18);T(dangerAlert,"Message","高风险状态已阻断，完成处置后方可继续。",44,13,298,14,"$semantic-danger","600","left","cmpAlertDangerMessage")
tableHeader=Box(palette,"Table/Header",40,414,920,40,"$surface-muted",0,"$border-base","cmpTableHeader");Update(tableHeader,{reusable:true});for(const [i,label] of ["编号","业务对象","责任人","更新时间","状态","操作"].entries())T(tableHeader,"Column "+label,label,16+i*150,11,130,12,"$text-regular","600","left","cmpTableHeaderCol"+i)
tableRow=Box(palette,"Table/Row",40,454,920,44,"$surface-panel",0,"$border-light","cmpTableRow");Update(tableRow,{reusable:true});for(const [i,label] of ["WT-260727-001","检测业务记录","审核人员","2026-07-27 10:30","待处理","查看"].entries())T(tableRow,"Cell "+i,label,16+i*150,13,130,12,i===5?"$brand-secondary":"$text-regular",i===5?"600":"400","left","cmpTableRowCell"+i)
skeleton=Box(palette,"State/Skeleton",1000,220,300,128,"$surface-panel",6,"$border-light","cmpStateSkeleton");Update(skeleton,{reusable:true});for(const [i,w] of [220,260,180].entries())Insert(skeleton,{type:"rectangle",name:"Skeleton Line",x:20,y:22+i*30,width:w,height:12,fill:"#E9EEF2",cornerRadius:4})
empty=Box(palette,"State/Empty",1320,220,300,128,"$surface-panel",6,"$border-light","cmpStateEmpty");Update(empty,{reusable:true});Ico(empty,"Icon","inbox",134,26,"$text-secondary",30);T(empty,"Title","暂无数据",90,66,120,14,"$text-regular","600","center");T(empty,"Help","调整筛选条件后重试",60,90,160,12,"$text-secondary","400","center")
switchOn=Box(palette,"Form/Switch/On",1660,220,48,24,"$brand-primary",12,"$brand-primary","cmpSwitchOn");Update(switchOn,{reusable:true});Insert(switchOn,{type:"ellipse",name:"Switch Thumb",x:26,y:2,width:20,height:20,fill:"#FFFFFF"})
switchOff=Box(palette,"Form/Switch/Off",1724,220,48,24,"#D1D5DB",12,"#D1D5DB","cmpSwitchOff");Update(switchOff,{reusable:true});Insert(switchOff,{type:"ellipse",name:"Switch Thumb",x:2,y:2,width:20,height:20,fill:"#FFFFFF"})
navRoot=Box(palette,"Navigation/RootItem",1820,220,184,32,"$brand-primary-dark",4,"$brand-primary-dark","cmpNavRoot");Update(navRoot,{reusable:true});Ico(navRoot,"Icon","chevron-right",12,9,"#BDE8E1",14);T(navRoot,"Label","一级模块",34,8,136,14,"#FFFFFF","500","left","cmpNavRootLabel")
navSubmenu=Box(palette,"Navigation/SubmenuItem",2020,220,160,28,"$brand-primary-dark",4,"$brand-primary-dark","cmpNavSubmenu");Update(navSubmenu,{reusable:true});T(navSubmenu,"Label","二级菜单",16,6,128,12,"#D6F4EF","400","left","cmpNavSubmenuLabel")
workflowStep=Box(palette,"Workflow/Step",2200,220,164,56,"$surface-panel",0,"$surface-panel","cmpWorkflowStep");Update(workflowStep,{reusable:true});Insert(workflowStep,{type:"ellipse",name:"Marker",x:68,y:0,width:28,height:28,fill:"$brand-primary",id:"cmpWorkflowStepMarker"});T(workflowStep,"Number","1",68,7,28,14,"$text-on-brand","700","center","cmpWorkflowStepNumber");WrapT(workflowStep,"Label","步骤名称",8,34,148,20,13,"$text-primary","600","center","cmpWorkflowStepLabel")
stepper=Box(palette,"Workflow/Stepper",3620,520,500,64,"$surface-panel",4,"$border-light","cmpWorkflowStepper");Update(stepper,{reusable:true});Insert(stepper,{type:"rectangle",name:"Track",x:52,y:14,width:396,height:2,fill:"$border-base",id:"cmpWorkflowStepperTrack"})
timelineItem=Box(palette,"Workflow/TimelineItem",2380,220,320,32,"$surface-panel",0,"$surface-panel","cmpTimelineItem");Update(timelineItem,{reusable:true});Insert(timelineItem,{type:"ellipse",name:"Marker",x:4,y:11,width:10,height:10,fill:"$brand-primary"});T(timelineItem,"Event","10:12 提交申请 · 审核人员",28,8,280,13,"$text-regular","400","left","cmpTimelineItemLabel")
filterBar=Box(palette,"Form/FilterBar",40,520,1176,96,"$surface-panel",6,"$border-light","cmpFilterBar");Update(filterBar,{reusable:true});T(filterBar,"Title","筛选条件",18,14,120,14,"$text-primary","600","left","cmpFilterBarTitle");Insert(filterBar,{type:"rectangle",name:"Divider",x:18,y:38,width:1140,height:1,fill:"$border-light"})
listToolbar=Box(palette,"Data/ListToolbar",1240,520,1176,56,"$surface-panel",0,"$border-light","cmpListToolbar");Update(listToolbar,{reusable:true});T(listToolbar,"Title","业务列表",18,18,420,16,"$text-primary","600","left","cmpListToolbarTitle")
checkboxChecked=Box(palette,"Form/Checkbox/Checked",2740,220,24,24,"$brand-primary",4,"$brand-primary","cmpCheckboxChecked");Update(checkboxChecked,{reusable:true});Ico(checkboxChecked,"Icon","check",4,4,"#FFFFFF",16)
checkboxWarning=Box(palette,"Form/Checkbox/Warning",2776,220,24,24,"$semantic-warning",4,"$semantic-warning","cmpCheckboxWarning");Update(checkboxWarning,{reusable:true});Ico(checkboxWarning,"Icon","clock-3",4,4,"#FFFFFF",16)
checkboxDanger=Box(palette,"Form/Checkbox/Danger",2812,220,24,24,"$semantic-danger",4,"$semantic-danger","cmpCheckboxDanger");Update(checkboxDanger,{reusable:true});Ico(checkboxDanger,"Icon","minus",4,4,"#FFFFFF",16)
checkboxEmpty=Box(palette,"Form/Checkbox/Empty",2848,220,24,24,"$surface-panel",4,"$border-base","cmpCheckboxEmpty");Update(checkboxEmpty,{reusable:true})
matrixCell=Box(palette,"Data/MatrixCell",2740,264,132,56,"#FFFFFF",0,"$border-light","cmpMatrixCell");Update(matrixCell,{reusable:true});T(matrixCell,"Label","授权状态",0,20,132,12,"$text-secondary","400","center","cmpMatrixCellLabel")
cardStandard=Box(palette,"Card/Standard",2900,220,360,160,"$surface-panel",6,"$border-light","cmpCardStandard");Update(cardStandard,{reusable:true});T(cardStandard,"Title","卡片标题",16,16,250,16,"$text-primary","600","left","cmpCardStandardTitle");Ico(cardStandard,"More","ellipsis",324,16,"$text-secondary",16);Insert(cardStandard,{type:"rectangle",name:"Divider",x:16,y:48,width:328,height:1,fill:"$border-light"});T(cardStandard,"Content","用于呈现独立业务摘要、待办或受控对象状态。",16,66,320,13,"$text-regular","400","left","cmpCardStandardContent");T(cardStandard,"Meta","更新时间：刚刚",16,126,180,12,"$text-secondary","400","left","cmpCardStandardMeta")
cardMetric=Box(palette,"Card/Metric",3280,220,264,116,"$surface-panel",6,"$border-light","cmpCardMetric");Update(cardMetric,{reusable:true});T(cardMetric,"Label","待处理任务",16,16,160,13,"$text-secondary","400","left","cmpCardMetricLabel");T(cardMetric,"Value","18",16,44,150,30,"$text-primary","700","left","cmpCardMetricValue");T(cardMetric,"Trend","较昨日 -3",154,68,94,12,"$semantic-success","600","right","cmpCardMetricTrend")
disabled=Box(palette,"Button/Disabled",416,220,112,36,"$surface-muted",4,"$border-base","cmpButtonDisabled");Update(disabled,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});disabledLabel=T(disabled,"Label","不可执行",0,0,112,14,"$text-disabled","600","center","cmpButtonDisabledLabel");Update(disabledLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
pageContainer=Box(palette,"Layout/PageContainer",2900,520,340,80,"$surface-panel",6,"$border-light","cmpPageContainer");Update(pageContainer,{reusable:true});T(pageContainer,"Title","稳定页面内容区",16,16,260,14,"$text-primary","600","left","cmpPageContainerTitle")
actionFooter=Box(palette,"Layout/ActionFooter",3260,520,340,56,"$surface-panel",0,"$border-light","cmpActionFooter");Update(actionFooter,{reusable:true});Insert(actionFooter,{type:"rectangle",name:"Divider",x:0,y:0,width:340,height:1,fill:"$border-light",id:"cmpActionFooterDivider"})
drawerDetail=Box(palette,"Drawer/Detail",4140,520,360,80,"$surface-panel",6,"$border-light","cmpDrawerDetail");Update(drawerDetail,{reusable:true});T(drawerDetail,"Title","选中记录详情",16,16,220,14,"$text-primary","600","left","cmpDrawerDetailTitle")
tableLayout=Box(palette,"Data/TableLayout",4520,520,500,80,"$surface-panel",6,"$border-light","cmpTableLayout");Update(tableLayout,{reusable:true});Insert(tableLayout,{type:"rectangle",name:"Header Surface",x:0,y:0,width:500,height:40,fill:"$surface-muted",id:"cmpTableLayoutHeader"})
modalStandard=Box(palette,"Modal/Standard",3564,220,480,236,"$surface-panel",6,"$border-base","cmpModalStandard");Update(modalStandard,{reusable:true});T(modalStandard,"Title","确认提交",24,22,360,18,"$text-primary","700","left","cmpModalStandardTitle");Ico(modalStandard,"Close","x",438,22,"$text-secondary",18);T(modalStandard,"Content","提交后将进入下一审批节点，相关操作会写入审计记录。",24,70,432,14,"$text-regular","400","left","cmpModalStandardContent");Insert(modalStandard,{type:"rectangle",name:"Footer Divider",x:0,y:166,width:480,height:1,fill:"$border-light"});cancel=Box(modalStandard,"Cancel",266,184,88,32,"$surface-panel",4,"$border-base");T(cancel,"Label","取消",0,8,88,13,"$text-regular","500","center","cmpModalStandardCancel");confirm=Box(modalStandard,"Confirm",368,184,88,32,"$brand-primary",4,"$brand-primary");T(confirm,"Label","确认",0,8,88,13,"$text-on-brand","600","center","cmpModalStandardConfirm")
for(const [i,item] of [["Info","系统消息","数据已同步到最新版本。","$semantic-info","#F4F4F5","info","cmpNotificationInfo"],["Success","操作成功","报告已提交至下一审批节点。","$semantic-success","#F0F9EB","circle-check","cmpNotificationSuccess"],["Warning","需要关注","设备校准将在 3 天后到期。","$semantic-warning","#FDF6EC","triangle-alert","cmpNotificationWarning"],["Danger","流程已阻断","签字授权范围不匹配，不能签发。","$semantic-danger","#FEF0F0","circle-x","cmpNotificationDanger"]].entries()){const notification=Box(palette,"Notification/"+item[0],4064+i*424,220,400,84,item[4],6,item[3],item[6]);Update(notification,{reusable:true});Ico(notification,"Icon",item[5],16,18,item[3],20);T(notification,"Title",item[1],48,14,290,14,"$text-primary","600","left",item[6]+"Title");T(notification,"Content",item[2],48,40,320,12,"$text-regular","400","left",item[6]+"Content");Ico(notification,"Close","x",368,16,"$text-secondary",16)}
Update(palette,{placeholder:false})
`;
}

function designSystemOperations(componentIds = {}) {
  return String.raw`
const C=${pencilString(componentIds)}
function DST(p,n,c,x,y,w,s=14,color="$text-regular",weight="400",align="left"){return Insert(p,{type:"text",name:n,content:c,x,y,width:w,fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width"})}
function DSB(p,n,x,y,w,h,fill="$surface-panel",radius=6,stroke="$border-light"){return Insert(p,{type:"frame",name:n,x,y,width:w,height:h,fill,cornerRadius:radius,stroke,strokeWidth:1,layout:"none",clip:true})}
function Ico(p,n,icon,x,y,color="$text-secondary",size=16){return Insert(p,{type:"icon",name:n,library:"lucide",icon,x,y,width:size,height:size,fill:color})}
function DSSection(title,x,y,w,h){const s=DSB(ds,"Section/"+title,x,y,w,h,"$surface-panel",6,"$border-light");DST(s,"Section Title",title,20,18,w-40,18,"$text-primary","700");Insert(s,{type:"rectangle",name:"Section Divider",x:20,y:50,width:w-40,height:1,fill:"$border-light"});return s}
function DSButton(p,label,x,y,w=104,tone="primary",disabled=false){const refs=disabled?[C.cmpButtonDisabled,C.cmpButtonDisabledLabel,"$text-disabled"]:tone==="danger"?[C.cmpButtonDanger,C.cmpButtonDangerLabel,"$text-on-brand"]:tone==="primary"?[C.cmpButtonPrimary,C.cmpButtonPrimaryLabel,"$text-on-brand"]:[C.cmpButtonSecondary,C.cmpButtonSecondaryLabel,"$text-regular"];const b=Insert(p,{type:"ref",name:"Button/"+label,ref:refs[0],x,y,width:w,height:34});Update(b+"/"+refs[1],{content:label,x:0,y:0,width:"fill_container",height:"fill_container",fill:refs[2],textAlign:"center",textAlignVertical:"middle",textGrowth:"fixed-width-height"});return b}
function DSField(p,label,value,x,y,w=250,state="default"){DST(p,"Field Label/"+label,label,x,y,w,12,state==="error"?"$semantic-danger":"$text-regular","500");const b=Insert(p,{type:"ref",name:"Form/"+label,ref:C.cmpFormInput,x,y:y+22,width:w,height:36});Update(b,{fill:state==="disabled"?"$surface-muted":"$surface-panel",stroke:state==="error"?"$semantic-danger":"$border-base"});Update(b+"/"+C.cmpFormInputValue,{content:value,width:w-24,fill:state==="disabled"?"$text-disabled":"$text-secondary"});return b}
function DSTag(p,label,x,y,tone="info"){const refs={success:[C.cmpTagSuccess,C.cmpTagSuccessLabel,"$semantic-success-bg","$semantic-success"],warning:[C.cmpTagWarning,C.cmpTagWarningLabel,"$semantic-warning-bg","$semantic-warning"],danger:[C.cmpTagDanger,C.cmpTagDangerLabel,"$semantic-danger-bg","$semantic-danger"],info:[C.cmpTagInfo,C.cmpTagInfoLabel,"$semantic-info-bg","$semantic-info"],brand:[C.cmpTagInfo,C.cmpTagInfoLabel,"$surface-selected","$brand-primary"]}[tone];const w=Math.max(64,label.length*14+18),b=Insert(p,{type:"ref",name:"Tag/"+label,ref:refs[0],x,y,width:w,height:28});Update(b,{fill:refs[2],stroke:refs[3]});Update(b+"/"+refs[1],{content:label,width:w-16,fill:refs[3]});return b}
ds=Insert(document,{type:"frame",id:"designSystemSheet",name:"CNAS LIMS Design Contact Sheet",x:0,y:0,width:3000,height:2380,fill:"#E9EEF2",layout:"none",clip:true,placeholder:true})
Insert(ds,{type:"rectangle",name:"Header",x:0,y:0,width:3000,height:146,fill:"$brand-primary-dark"})
DST(ds,"Title","CNAS LIMS · web-ele 设计系统组件",40,30,1500,32,"#FFFFFF","700")
DST(ds,"Subtitle","华衡检测实验室 · Vben Admin 5.x + Element Plus 组件语义基线",40,78,1600,15,"#D6F4EF","400")
DST(ds,"Version","DESIGN SYSTEM 1.0",2580,44,360,14,"#BDE8E1","600","right")

tokens=DSSection("01 设计令牌",40,176,920,560)
for(const [i,item] of [["主色","$brand-primary"],["辅助蓝","$brand-secondary"],["成功","$semantic-success"],["警告","$semantic-warning"],["危险","$semantic-danger"],["信息","$semantic-info"],["页面","$surface-page"],["面板","$surface-panel"]].entries()){const x=20+(i%4)*216,y=72+Math.floor(i/4)*96;const b=DSB(tokens,"Token/"+item[0],x,y,196,76,"#FFFFFF",4,"$border-light");Insert(b,{type:"rectangle",name:"Swatch",x:12,y:12,width:42,height:42,fill:item[1],cornerRadius:4});DST(b,"Name",item[0],66,18,112,13,"$text-primary","600")}
DST(tokens,"Typography","字体 Microsoft YaHei · 12 / 14 / 16 / 20 / 24 / 32",20,286,860,14,"$text-regular","600")
for(const [i,size] of [12,14,16,20,24,32].entries())DST(tokens,"Type/"+size,"Aa 中文 "+size,20+i*142,326,128,size,"$text-primary",size>=20?"700":"400")
DST(tokens,"Spacing","间距 4 / 8 / 12 / 16 / 24 / 32 · 圆角 2 / 4 / 20 / 100 · 字间距 0",20,404,860,14,"$text-regular","600")
DST(tokens,"Responsive","断点：390 移动 · 1280 窄桌面 · 1440 标准桌面",20,448,860,14,"$text-secondary")

nav=DSSection("02 导航",990,176,920,560)
sidebar=DSB(nav,"Navigation/Sidebar",20,72,220,450,"$brand-primary-dark",6,"$brand-primary-dark");DST(sidebar,"Brand","CNAS LIMS",20,18,170,18,"#FFFFFF","700");for(const [i,label] of ["工作台","客户与委托","样品管理","检测管理","报告管理","体系管理"].entries()){if(i===2)Insert(sidebar,{type:"rectangle",name:"Active",x:12,y:62+i*48,width:196,height:36,fill:"#FFFFFF20",cornerRadius:4});DST(sidebar,"Menu/"+label,label,28,71+i*48,160,14,"#FFFFFF",i===2?"700":"400")}
top=DSB(nav,"Navigation/Topbar",260,72,630,56,"#FFFFFF",4,"$border-light");DST(top,"Search","搜索样品、任务、报告、文件",18,18,320,14,"$text-secondary");DST(top,"Account","通知  ·  当前用户",430,18,180,13,"$text-regular","500","right")
crumb=DSB(nav,"Navigation/Breadcrumb",260,148,630,44,"#FFFFFF",4,"$border-light");DST(crumb,"Text","样品管理 / 样品台账 / 样品详情",16,14,560,12,"$text-secondary")
tabs=DSB(nav,"Navigation/Tabs",260,212,630,48,"#FFFFFF",4,"$border-light");for(const [i,label] of ["综合工作台","样品台账","样品详情"].entries()){DST(tabs,"Tab/"+label,label,18+i*170,16,150,13,i===1?"$brand-primary":"$text-secondary",i===1?"600":"400");if(i===1)Insert(tabs,{type:"rectangle",name:"Active Line",x:18+i*170,y:45,width:72,height:3,fill:"$brand-primary"})}
tree=DSB(nav,"Navigation/Tree",260,280,300,242,"#FAFCFC",4,"$border-light");DST(tree,"Title","树形二级菜单",16,14,240,14,"$text-primary","600");Ico(tree,"Expanded Icon","chevron-down",16,54,"$text-secondary",14);DST(tree,"Root/样品管理","样品管理",40,53,200,13,"$text-regular","600");for(const [i,label] of ["样品接收","样品台账","样品流转"].entries()){const active=i===1;if(active)Insert(tree,{type:"rectangle",name:"Active Submenu",x:34,y:82+i*34,width:248,height:28,fill:"$brand-primary-light-9",cornerRadius:4});DST(tree,"Submenu/"+label,label,48,89+i*34,210,13,active?"$brand-primary":"$text-regular",active?"600":"400")}Ico(tree,"Collapsed Icon","chevron-right",16,190,"$text-secondary",14);DST(tree,"Root/检测管理","检测管理",40,189,200,13,"$text-regular","600")

actions=DSSection("03 操作与反馈",1940,176,1020,560)
DSButton(actions,"主要操作",20,74,108,"primary");DSButton(actions,"次要操作",144,74,108,"secondary");DSButton(actions,"危险操作",268,74,108,"danger");DSButton(actions,"禁用操作",392,74,108,"secondary",true);DSButton(actions,"批量处理",516,74,108,"primary")
for(const [i,item] of [["通过","success"],["待处理","warning"],["已阻断","danger"],["草稿","info"],["进行中","brand"]].entries())DSTag(actions,item[0],20+i*118,134,item[1])
alert=Insert(actions,{type:"ref",name:"Alert/Warning",ref:C.cmpAlertWarning,x:20,y:196,width:960,height:48});Update(alert+"/"+C.cmpAlertWarningMessage,{content:"资源、授权或数据完整性不满足时阻断流程，并提示恢复路径。",width:890,fill:"$text-warning"})
result=DSB(actions,"Result/AccessDenied",20,282,458,220,"#FAFCFC",4,"$border-light");DST(result,"Icon","!",204,28,50,32,"$semantic-danger","700","center");DST(result,"Title","权限不足",90,78,278,18,"$text-primary","700","center");DST(result,"Help","当前角色无权执行该操作，请联系权限管理员。",48,116,362,13,"$text-regular","400","center");DSButton(result,"返回上一页",170,162,118,"secondary")
modal=DSB(actions,"Modal/Confirm",502,282,478,220,"#FFFFFF",6,"$border-base");DST(modal,"Title","确认提交",20,18,300,16,"$text-primary","700");DST(modal,"Content","提交后进入下一审批节点，操作将记录审计轨迹。",20,62,430,13,"$text-regular");DSButton(modal,"取消",232,164,96,"secondary");DSButton(modal,"确认",342,164,96,"primary")

forms=DSSection("04 表单",40,766,1390,620)
DSField(forms,"文本输入","请输入内容",20,74,300);DSField(forms,"下拉选择","请选择",340,74,300);DSField(forms,"日期范围","2026-07-01 至 2026-07-31",660,74,300);DSField(forms,"级联选择","场所 / 专业组 / 项目",980,74,370)
DSField(forms,"校验错误","该字段不能为空",20,164,300,"error");DSField(forms,"只读字段","受控编号 LAB-026",340,164,300,"disabled");DSField(forms,"禁用字段","当前状态不可编辑",660,164,300,"disabled")
upload=DSB(forms,"Upload/Dropzone",20,272,500,180,"#FAFCFC",6,"$border-base");DST(upload,"Icon","上传",200,38,100,20,"$brand-secondary","700","center");DST(upload,"Hint","拖拽文件到此处，或点击选择文件",60,82,380,14,"$text-regular","600","center");DST(upload,"Rule","支持受控格式；失败后保留重试入口",60,118,380,12,"$text-secondary","400","center")
switches=DSB(forms,"Form/Switches",548,272,376,180,"#FFFFFF",4,"$border-light");DST(switches,"Title","开关与选择",16,16,300,14,"$text-primary","600");for(const [i,label] of ["启用到期提醒","要求电子签名","锁定归档记录"].entries()){Insert(switches,{type:"ref",name:"Switch/"+label,ref:i<2?C.cmpSwitchOn:C.cmpSwitchOff,x:18,y:56+i*38,width:48,height:24});DST(switches,"Label",label,78,60+i*38,250,13,"$text-regular")}
validation=DSB(forms,"Form/Validation",952,272,398,180,"#FEF0F0",4,"$semantic-danger");DST(validation,"Title","表单校验",16,16,300,14,"$semantic-danger","700");DST(validation,"Content","• 必填项缺失\n• 日期范围无效\n• 上传文件校验失败\n• 无权限字段保持只读",16,52,350,13,"$text-regular")

data=DSSection("05 数据展示",1460,766,1500,620)
filter=DSB(data,"VbenForm/FilterBar",20,72,1460,80,"#FAFCFC",4,"$border-light");DSField(filter,"关键词","输入编号或名称",16,10,300);DSField(filter,"状态","请选择",334,10,240);DSButton(filter,"查询",1170,34,92,"primary");DSButton(filter,"重置",1276,34,92,"secondary")
table=DSB(data,"VxeTable",20,174,980,340,"#FFFFFF",4,"$border-light");tableHeader=Insert(table,{type:"ref",name:"Table Header Instance",ref:C.cmpTableHeader,x:0,y:0,width:980,height:40});for(let r=0;r<5;r++){tableRow=Insert(table,{type:"ref",name:"Table Row Instance "+(r+1),ref:C.cmpTableRow,x:0,y:40+r*48,width:980,height:44});Update(tableRow,{fill:r%2?"$surface-subtle":"$surface-panel"})}
DST(table,"Pagination","共 58 条  20 条/页  1  2  3  下一页",604,302,350,12,"$text-secondary","400","right")
states=DSB(data,"Data/States",1024,174,456,340,"#FAFCFC",4,"$border-light");DST(states,"Title","加载、空态与骨架屏",18,18,400,14,"$text-primary","600");Insert(states,{type:"ref",name:"State/Skeleton Preview",ref:C.cmpStateSkeleton,x:24,y:48,width:400,height:112});Insert(states,{type:"ref",name:"State/Empty Preview",ref:C.cmpStateEmpty,x:78,y:164,width:300,height:128});DSButton(states,"清空筛选",164,300,128,"secondary")

workflow=DSSection("06 流程与审批",40,1416,1390,900)
DST(workflow,"Steps Title","Steps 步骤条",20,72,300,14,"$text-primary","600");for(const [i,label] of ["提交申请","业务审核","批准确认","完成"].entries()){const x=28+i*310,labelX=Math.max(0,x-44);if(i<3)Insert(workflow,{type:"rectangle",name:"Step Connector",x:x+28,y:125,width:282,height:4,fill:i<1?"$brand-primary":"$border-base"});Insert(workflow,{type:"ellipse",name:"Step",x,y:112,width:28,height:28,fill:i<2?"$brand-primary":"#E5E7EB"});DST(workflow,"Step Number",String(i+1),x,118,28,12,i<2?"#FFFFFF":"$text-secondary","700","center");DST(workflow,"Step Label",label,labelX,152,116,13,i<2?"$text-primary":"$text-secondary",i===1?"600":"400","center")}
timeline=DSB(workflow,"Timeline/Audit",20,176,520,330,"#FAFCFC",4,"$border-light");DST(timeline,"Title","流程与审计时间线",18,18,420,15,"$text-primary","600");for(const [i,label] of ["提交申请 · 10:12","审核通过 · 11:05","等待批准 · 当前","退回补充 · 可选路径"].entries()){Insert(timeline,{type:"ellipse",name:"Dot",x:24,y:62+i*58,width:10,height:10,fill:i===2?"$semantic-warning":i===3?"$semantic-danger":"$brand-primary"});DST(timeline,"Event",label,52,57+i*58,420,13,"$text-regular",i===2?"600":"400")}
approval=DSB(workflow,"Approval/Opinion",566,176,784,330,"#FFFFFF",4,"$border-light");DST(approval,"Title","审批意见与电子签名确认",18,18,500,15,"$text-primary","600");DSField(approval,"审批意见","请填写明确的审核意见",18,62,748);sign=DSB(approval,"Electronic Signature",18,164,748,76,"#F0F5F4",4,"$border-base");DST(sign,"Label","身份确认后提交；签名层级 [待确认]",18,18,600,14,"$text-primary","600");DSButton(sign,"身份确认",618,20,112,"secondary");DSButton(approval,"退回修改",530,270,104,"secondary");DSButton(approval,"提交审核",648,270,104,"primary")
drawer=DSB(workflow,"Drawer/Detail",20,536,600,300,"#FFFFFF",4,"$border-light");DST(drawer,"Title","Drawer 详情抽屉",18,18,400,15,"$text-primary","600");for(const [i,item] of [["业务编号","LAB-026"],["当前状态","待审核"],["责任角色","质量负责人"],["进入方式","列表行操作"],["返回目标","保留筛选条件"]].entries()){DST(drawer,"Label",item[0],18,64+i*40,110,12,"$text-secondary","600");DST(drawer,"Value",item[1],142,64+i*40,420,13,"$text-regular")}
page=DSB(workflow,"Page/Container",646,536,704,300,"$surface-muted",4,"$border-light");DST(page,"Page Title","Page 页面容器",20,18,360,20,"$text-primary","700");DST(page,"Description","标题、目标、工具栏和稳定内容区",20,52,500,13,"$text-secondary");content=DSB(page,"Content",20,94,664,184,"#FFFFFF",4,"$border-light");for(const [i,label] of ["概览","记录","附件","审计轨迹"].entries()){const active=i===0;DST(content,"Tab/"+label,label,18+i*76,16,64,13,active?"$brand-primary":"$text-secondary",active?"600":"400","center");if(active)Insert(content,{type:"rectangle",name:"Tab Active Line",x:24,y:43,width:52,height:2,fill:"$brand-primary"})};Insert(content,{type:"rectangle",name:"Tab Divider",x:18,y:44,width:628,height:1,fill:"$border-light"});DST(content,"Body","Tree · Upload · Descriptions · Chart · Table",18,82,600,16,"$text-regular","600")

surfaces=DSSection("07 卡片、弹窗与通知",1460,1416,1500,900)
DST(surfaces,"Card Caption","卡片",20,72,280,14,"$text-primary","600")
standardCard=DSB(surfaces,"Card/Standard Preview",20,102,300,178,"#FFFFFF",6,"$border-light");DST(standardCard,"Title","待办处理概览",16,16,206,16,"$text-primary","600");Ico(standardCard,"More","ellipsis",266,16,"$text-secondary",16);Insert(standardCard,{type:"rectangle",name:"Divider",x:16,y:48,width:268,height:1,fill:"$border-light"});DST(standardCard,"Content","需要在当前工作日完成质量事件影响评估。",16,66,268,13,"$text-regular");DST(standardCard,"Meta","责任人：质量负责人",16,128,180,12,"$text-secondary");DSTag(standardCard,"待处理",198,122,"warning")
metricCard=DSB(surfaces,"Card/Metric Preview",20,304,300,118,"#FFFFFF",6,"$border-light");DST(metricCard,"Label","待处理任务",16,16,160,13,"$text-secondary");DST(metricCard,"Value","18",16,44,120,30,"$text-primary","700");DST(metricCard,"Trend","较昨日 -3",178,68,104,12,"$semantic-success","600","right")
DST(surfaces,"Modal Caption","弹窗",350,72,300,14,"$text-primary","600")
modalPreview=DSB(surfaces,"Modal/Standard Preview",350,102,500,248,"#FFFFFF",6,"$border-base");DST(modalPreview,"Title","确认提交审核",24,22,360,18,"$text-primary","700");Ico(modalPreview,"Close","x",458,22,"$text-secondary",18);DST(modalPreview,"Content","提交后将进入下一审批节点。请确认审核意见完整，并核验授权范围与电子签名状态。",24,70,440,14,"$text-regular");Insert(modalPreview,{type:"rectangle",name:"Footer Divider",x:0,y:174,width:500,height:1,fill:"$border-light"});DSButton(modalPreview,"取消",300,194,84,"secondary");DSButton(modalPreview,"确认提交",396,194,80,"primary")
dangerModal=DSB(surfaces,"Modal/Danger Preview",350,382,500,222,"#FFFFFF",6,"$border-base");Ico(dangerModal,"Danger Icon","triangle-alert",24,22,"$semantic-danger",18);DST(dangerModal,"Title","确认暂停任务",52,22,320,18,"$text-primary","700");Ico(dangerModal,"Close","x",458,22,"$text-secondary",18);DST(dangerModal,"Content","暂停后将阻断后续步骤，需补充处置原因并通知相关责任人。",24,70,440,14,"$text-regular");Insert(dangerModal,{type:"rectangle",name:"Footer Divider",x:0,y:148,width:500,height:1,fill:"$border-light"});DSButton(dangerModal,"取消",300,168,84,"secondary");DSButton(dangerModal,"确认暂停",396,168,80,"danger")
DST(surfaces,"Notification Caption","消息通知",880,72,300,14,"$text-primary","600")
for(const [i,item] of [["Info","系统消息","数据已同步到最新版本。","$semantic-info","#F4F4F5","info"],["Success","操作成功","报告已提交至下一审批节点。","$semantic-success","#F0F9EB","circle-check"],["Warning","需要关注","设备校准将在 3 天后到期。","$semantic-warning","#FDF6EC","triangle-alert"],["Danger","流程已阻断","签字授权范围不匹配，不能签发。","$semantic-danger","#FEF0F0","circle-x"]].entries()){const notice=DSB(surfaces,"Notification/"+item[0]+" Preview",880,102+i*108,580,88,item[4],6,item[3]);Ico(notice,"Icon",item[5],16,18,item[3],20);DST(notice,"Title",item[1],48,14,456,14,"$text-primary","600");DST(notice,"Content",item[2],48,42,480,12,"$text-regular");Ico(notice,"Close","x",544,16,"$text-secondary",16)}
tokenNote=DSB(surfaces,"Surface Tokens",20,660,830,154,"#FAFCFC",4,"$border-light");DST(tokenNote,"Title","表面与浮层 token",18,18,300,14,"$text-primary","600");DST(tokenNote,"Content","Card：padding 16 · 最小高度 160 · 圆角 6 · 层级 1\nModal：宽度 480 · 内边距 24 · 层级 16\nNotification：宽度 400 · 高度 84 · 状态色沿用语义 token",18,54,760,13,"$text-regular")
Update(ds,{placeholder:false})
`;
}

function pageOperations(pages, componentIds = {}, options = {}) {
  const specs = JSON.stringify(pages);
  const navigation = JSON.stringify(navigationModel);
  const includeContactSheet = options.includeContactSheet ?? false;
  const frameOffset = options.frameOffset ?? 0;
  const includeInteractionBoard = options.includeInteractionBoard ?? false;
  const boardSpec = includeInteractionBoard ? JSON.stringify(interactionBoardSpec(pages)) : 'null';
  const flowBoards = JSON.stringify(options.flowBoards ?? []);
  const stateBoards = JSON.stringify(options.stateBoards ?? []);
  const operations = String.raw`
(() => {
const specs=${specs}
const navigation=${navigation}
const includeContactSheet=${includeContactSheet};const frameOffset=${frameOffset};const includeInteractionBoard=${includeInteractionBoard};const boardSpec=${boardSpec};const flowBoards=${flowBoards};const stateBoards=${stateBoards};const pageStartY=includeContactSheet?440:0;
const desktop=specs.filter(s=>!s.id.startsWith("M"));const mobile=specs.filter(s=>s.id.startsWith("M"));
const desktopRows=Math.ceil((desktop.length+stateBoards.length+flowBoards.length+(includeInteractionBoard?1:0))/4);const mobileRows=Math.ceil(mobile.length/8);
const sheetHeight=mobile.length?440+desktopRows*1020+mobileRows*964-60:desktopRows*1020+380;let sheet;
function Safe(c){let value=String(c);for(const pair of [["演示数据","业务数据"],["演示环境","需求评审环境"],["全部用户","已认证用户"],["（演示）",""],["DEMO","LAB"],["演示","业务"]])value=value.split(pair[0]).join(pair[1]);return value}
function T(p,n,c,x,y,w,s=14,color="$text-regular",weight="400",align="left"){return Insert(p,{type:"text",name:n,content:Safe(c),x,y,width:w,height:Math.ceil(s*1.4),fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width-height"})}
function WrapT(p,n,c,x,y,w,h,s=14,color="$text-regular",weight="400",align="left"){return Insert(p,{type:"text",name:n,content:Safe(c),x,y,width:w,height:h,fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width-height"})}
function Box(p,n,x,y,w,h,fill="$surface-panel",radius=4,stroke="$border-light"){return Insert(p,{type:"frame",name:n,x,y,width:w,height:h,fill,cornerRadius:radius,stroke,strokeWidth:1,layout:"none",clip:true})}
function Ico(p,n,icon,x,y,color="$text-secondary",size=16){return Insert(p,{type:"icon",name:n,library:"lucide",icon,x,y,width:size,height:size,fill:color})}
if(includeContactSheet){sheet=Insert(document,{type:"frame",id:"contactSheet",name:"CNAS LIMS Design Contact Sheet",x:0,y:0,width:6120,height:380,fill:"$surface-page",layout:"none",clip:true,placeholder:true})
Insert(sheet,{type:"rectangle",name:"Contact Sheet Header",x:0,y:0,width:6120,height:380,fill:"$surface-page"})
T(sheet,"Contact Sheet Title","CNAS 实验室信息管理系统 · web-ele 页面设计",40,36,1200,28,"$text-primary","700")
T(sheet,"Contact Sheet Subtitle","华衡检测实验室 · Vben Admin 5.x + Element Plus · 需求评审稿",40,82,1200,14,"$text-secondary")
for(const [i,item] of [["主色","$brand-primary"],["辅助蓝","$brand-secondary"],["成功","$semantic-success"],["警告","$semantic-warning"],["危险","$semantic-danger"],["信息","$semantic-info"]].entries()){const b=Box(sheet,"Overview Token/"+item[0],40+i*176,132,160,76,"$surface-panel",6);Insert(b,{type:"rectangle",name:"Swatch",x:12,y:12,width:40,height:40,fill:item[1],cornerRadius:4});T(b,"Label",item[0],64,21,80,13,"$text-primary","600")}
const note=Box(sheet,"Overview Note",40,244,1120,86,"#FFFFFF",6,"$border-light");T(note,"Title","页面覆盖与状态约束",18,14,260,15,"$text-primary","600");T(note,"Content","关键操作呈现权限、异常、审计和受控状态；页面数据均为非生产样例。",18,46,1040,13,"$text-regular")
}
function Tag(p,label,x,y,tone="info"){const clean=Safe(label);if(!clean)return null;const map={success:["$semantic-success-bg","$semantic-success","cmpTagSuccess","cmpTagSuccessLabel"],warning:["$semantic-warning-bg","$semantic-warning","cmpTagWarning","cmpTagWarningLabel"],danger:["$semantic-danger-bg","$semantic-danger","cmpTagDanger","cmpTagDangerLabel"],info:["$semantic-info-bg","$semantic-info","cmpTagInfo","cmpTagInfoLabel"],brand:["$surface-selected","$brand-primary","cmpTagInfo","cmpTagInfoLabel"]};const m=map[tone];const w=Math.max(56,clean.length*14+16);const b=Insert(p,{type:"ref",name:"Tag Instance/"+clean,ref:m[2],x,y,width:w,height:26});Update(b,{fill:m[0],stroke:m[1]});Update(b+"/"+m[3],{content:clean,width:w-16,fill:m[1]});return b}
function RawButton(p,label,x,y,primary=false,w=96){const variant=primary==="danger"?"danger":primary?"primary":"secondary";const refs={primary:["cmpButtonPrimary","cmpButtonPrimaryLabel","#FFFFFF"],secondary:["cmpButtonSecondary","cmpButtonSecondaryLabel","$text-regular"],danger:["cmpButtonDanger","cmpButtonDangerLabel","#FFFFFF"]}[variant];const b=Insert(p,{type:"ref",name:"Button Instance/"+label,ref:refs[0],x,y,width:w,height:34});Update(b+"/"+refs[1],{content:Safe(label),x:0,y:0,width:"fill_container",height:"fill_container",fill:refs[2],textAlign:"center",textAlignVertical:"middle",textGrowth:"fixed-width-height"});return b}
function Button(p,label,x,y,primary=false,w=96){const action=ActionContract(label);if(activeSpec&&!action)return null;if(action?.controlState==="disabled")return DisabledButton(p,label,x,y,w);const node=RawButton(p,label,x,y,primary,w);Update(node,{name:ActionName(label)});return node}
function RawDisabledButton(p,label,x,y,w=140){const b=Insert(p,{type:"ref",name:"Button Instance/"+label,ref:"cmpButtonDisabled",x,y,width:w,height:34});Update(b+"/cmpButtonDisabledLabel",{content:Safe(label),x:0,y:0,width:"fill_container",height:"fill_container",textAlign:"center",textAlignVertical:"middle",textGrowth:"fixed-width-height"});return b}
function DisabledButton(p,label,x,y,w=140){const action=ActionContract(label);if(activeSpec&&!action)return null;const node=RawDisabledButton(p,label,x,y,w);Update(node,{name:ActionName(label,true)});return node}
function Field(p,label,value,x,y,w=220){T(p,"Field Label/"+label,label,x,y,w,12,"$text-regular","500");const b=Insert(p,{type:"ref",name:"Input Instance/"+label,ref:"cmpFormInput",x,y:y+22,width:w,height:36});Update(b+"/cmpFormInputValue",{content:Safe(value),width:w-24,fill:String(value).indexOf("请选择")>=0?"$text-secondary":"$text-primary"});return b}
function WarningAlert(p,message,x,y,w){const compact=w<420;const ref=compact?"cmpAlertWarningCompact":"cmpAlertWarning",label=compact?"cmpAlertWarningCompactMessage":"cmpAlertWarningMessage",h=compact?60:48;const b=Insert(p,{type:"ref",name:"Alert Warning Instance",ref,x,y,width:w,height:h});Update(b+"/"+label,{content:Safe(message),width:w-70,height:compact?36:22,fill:"$text-warning"});return b}
function DangerAlert(p,message,x,y,w){const b=Insert(p,{type:"ref",name:"Alert Danger Instance",ref:"cmpAlertDanger",x,y,width:w,height:48});Update(b+"/cmpAlertDangerMessage",{content:Safe(message),width:w-70});return b}
function Container(p,name,x,y,w,h,fill="$surface-panel"){const b=Box(p,name,x,y,w,h,fill,6,"$border-light");const surface=Insert(b,{type:"ref",name:"Page Container Surface",ref:"cmpPageContainer",x:0,y:0,width:w,height:h});Update(surface,{fill,stroke:"$border-light"});Update(surface+"/cmpPageContainerTitle",{content:""});return b}
function ActionFooter(p,x,y,w,leftLabel,rightLabel,rightTone=true,leftWidth=104,rightWidth=114){const footer=Box(p,"Action Footer",x,y,w,56,"$surface-panel",0,"$border-light");const surface=Insert(footer,{type:"ref",name:"Action Footer Surface",ref:"cmpActionFooter",x:0,y:0,width:w,height:56});Update(surface+"/cmpActionFooterDivider",{width:w});if(leftLabel)Button(footer,leftLabel,w-leftWidth-rightWidth-32,11,false,leftWidth);Button(footer,rightLabel,w-rightWidth-16,11,rightTone===null?true:rightTone,rightWidth);return footer}
function Checkbox(p,label,x,y,state="checked",w=280){const refs={checked:"cmpCheckboxChecked",warning:"cmpCheckboxWarning",danger:"cmpCheckboxDanger",empty:"cmpCheckboxEmpty"};Insert(p,{type:"ref",name:"Checkbox Instance/"+label,ref:refs[state],x,y,width:20,height:20});T(p,"Checkbox Label/"+label,label,x+30,y+2,w,13,state==="danger"?"$semantic-danger":state==="warning"?"$semantic-warning":"$text-regular",state==="empty"?"400":"500");}
function InteractionStateBoard(board,model){const p=model.profile||{},fields=p.edit?.fields||[],steps=p.flow?.steps||["提交申请","核验条件","处理事项","完成"];T(board,"Interaction Board Kicker","交互状态板 · "+model.root,24,18,520,14,"$brand-primary","600");T(board,"Interaction Board Title",model.title,24,42,780,26,"$text-primary","700");T(board,"Interaction Board Reference","覆盖编辑、详情、确认、阻断、成功、流程与审计 · 参考页面："+model.referencePage,24,78,920,14,"$text-secondary");Tag(board,"模块基线",1120,28,"brand");
const edit=Box(board,"Interaction Edit State",24,112,430,322,"$surface-panel",6);T(edit,"Section Title","编辑态与校验",16,16,260,16,"$text-primary","600");Tag(edit,"草稿",16,48,"info");Field(edit,fields[0]||"业务对象","请输入或选择",16,78,188);Field(edit,fields[1]||"状态说明","待补充",220,78,188);const skeleton=Insert(edit,{type:"ref",name:"State Instance/Skeleton",ref:"cmpStateSkeleton",x:16,y:172,width:392,height:38});Update(skeleton,{opacity:.72});for(const [i,line] of ["cmpStateSkeletonLine0","cmpStateSkeletonLine1","cmpStateSkeletonLine2"].entries())Update(skeleton+"/"+line,{y:4+i*11,height:8});WrapT(edit,"Validation","必填项完整 · 业务状态允许当前操作 · 关联证据与资源可用",16,226,392,32,12,"$text-secondary");Button(edit,"保存草稿",16,274,false,104);Button(edit,"提交审核",132,274,true,104);DisabledButton(edit,"需要补充",248,274,112);
const detail=Box(board,"Interaction Detail State",474,112,430,322,"$surface-panel",6);T(detail,"Section Title","详情态与抽屉",16,16,260,16,"$text-primary","600");Tag(detail,"可查看",16,48,"success");const drawer=Insert(detail,{type:"ref",name:"Drawer/Detail Instance",ref:"cmpDrawerDetail",x:16,y:82,width:398,height:174});Update(drawer+"/cmpDrawerDetailTitle",{content:"详情抽屉 · "+model.referencePage,width:330});WrapT(detail,"Detail Summary","基本信息 · 关联业务 · 当前状态",16,268,398,24,13,"$text-regular");Button(detail,"编辑详情",246,274,false,112);
const modalPanel=Box(board,"Interaction Confirm Modal",924,112,492,322,"$surface-panel",6);T(modalPanel,"Section Title","确认弹窗与状态变更",16,16,300,16,"$text-primary","600");const modal=Insert(modalPanel,{type:"ref",name:"Modal/Standard Instance",ref:"cmpModalStandard",x:8,y:52,width:480,height:236});Update(modal+"/cmpModalStandardTitle",{content:p.modal?.title||"确认提交当前变更",width:360});Update(modal+"/cmpModalStandardContent",{content:p.modal?.content||"提交后将进入受控流程，并保留操作原因与审计留痕。",width:408});Update(modal+"/cmpModalStandardCancel",{content:"取消"});Update(modal+"/cmpModalStandardConfirmButton",{fill:p.modal?.variant==="warning"?"$semantic-danger":"$brand-primary"});Update(modal+"/cmpModalStandardConfirm",{content:p.modal?.action||"确认提交",fill:"$text-on-brand"});WrapT(modalPanel,"Modal Hint","高风险状态变更必须确认原因、影响范围和通知对象。",16,294,460,20,12,"$text-secondary");
const blocker=Box(board,"Interaction Blocker State",24,460,430,416,"$surface-panel",6);T(blocker,"Section Title","阻断态与禁用操作",16,16,260,16,"$text-primary","600");Tag(blocker,"已阻断",16,48,"danger");DangerAlert(blocker,"当前账号无流程权限或关键证据缺失，不能提交。",16,88,398);const empty=Insert(blocker,{type:"ref",name:"State Instance/Empty",ref:"cmpStateEmpty",x:16,y:158,width:398,height:128});Update(empty,{opacity:.82});WrapT(blocker,"Blocker Reasons",(p.blocker?.reasons||[]).join(" · "),16,294,398,28,12,"$text-secondary");DisabledButton(blocker,"提交下一步",16,350,128);Button(blocker,"返回处理",158,350,false,104);
const flow=Box(board,"Interaction Flow State",474,460,430,416,"$surface-panel",6);T(flow,"Section Title","流程节点与当前状态",16,16,260,16,"$text-primary","600");Steps(flow,steps,50,398);Tag(flow,"等待下一节点",16,142,"warning");Timeline(flow,16,184,398);WrapT(flow,"Flow Summary",p.flow?.pending||"等待下一节点",16,324,398,26,12,"$text-secondary");Button(flow,"查看流程记录",246,366,false,128);
const audit=Box(board,"Interaction Success Audit",924,460,492,416,"$surface-panel",6);T(audit,"Section Title","成功反馈与审计留痕",16,16,300,16,"$text-primary","600");Notification(audit,"success",p.success?.title||"操作成功",p.success?.message||"变更已保存并记录审计。",16,50,220);Notification(audit,"info","审计提示","打开、查看与导出均记录访问日志。",252,50,220);Notification(audit,"warning","待处理","流程等待下一节点处理。",16,146,220);Notification(audit,"danger","阻断留痕","阻断原因与处置动作已记录。",252,146,220);WrapT(audit,"Audit Events","审计事件已记录 · 操作人："+(p.audit?.actor||"当前用户"),16,238,460,20,12,"$text-secondary");Timeline(audit,16,270,460);}
function ActionStateBoard(board,model){const action=model.action,source=specs.find(s=>s.id===model.sourcePageId)||{},disabled=action.controlState==="disabled";AppShell(board,{...source,root:model.root,menu:source.menu||"流程操作",pageType:"操作页",title:model.title});T(board,"Page Title",model.title,240,116,620,24,"$text-primary","700");T(board,"Page Goal","来源页面："+model.sourcePageId+" "+model.sourcePageTitle+" · 界面形态："+action.surface,240,150,900,13,"$text-secondary");const context=Box(board,"State Context",240,194,1176,112,"$surface-subtle",6);Tag(context,disabled?"操作已阻断":action.surface==="modal"?"弹窗状态":"抽屉状态",18,16,disabled?"danger":action.surface==="modal"?"warning":"info");T(context,"Action Id","动作："+action.actionId,18,54,520,14,"$text-primary","600");WrapT(context,"Visible When",disabled?"启用条件："+action.enabledWhen+" · 禁用原因："+action.disabledReason:"显示条件："+action.visibleWhen,18,78,1118,22,12,disabled?"$semantic-danger":"$text-secondary");const stage=Box(board,"State Surface",240,326,1176,430,"$surface-panel",6);if(action.surface==="modal"){const modal=Insert(stage,{type:"ref",name:"Modal/"+action.variantFrameId,ref:"cmpModalStandard",x:348,y:70,width:480,height:236});Update(modal+"/cmpModalStandardTitle",{content:action.label+" · "+(disabled?"条件未满足":"确认"),width:360});Update(modal+"/cmpModalStandardContent",{content:disabled?action.disabledReason+"。启用条件："+action.enabledWhen:"请核验当前状态、前置证据和操作影响。提交后记录来源、原因、目标节点与版本历史。",width:408});Update(modal+"/cmpModalStandardCancel",{content:"返回 "+action.returnTarget});Update(modal+"/cmpModalStandardConfirmButton",disabled?{fill:"$surface-muted",stroke:"$border-base"}:{fill:"$brand-primary"});Update(modal+"/cmpModalStandardConfirm",{content:action.label,fill:disabled?"$text-disabled":"$text-on-brand"});}else{const drawer=Insert(stage,{type:"ref",name:"Drawer/"+action.variantFrameId,ref:"cmpDrawerDetail",x:568,y:32,width:560,height:350});Update(drawer+"/cmpDrawerDetailTitle",{content:action.label+" · 完整状态",width:480});WrapT(stage,"Drawer Context","基本信息 · 关联详情 · 证据附件 · 当前状态 · 版本与审计",32,54,500,24,14,"$text-primary","600");Timeline(stage,32,108,500);}
const footer=Box(board,"State Action Footer",240,776,1176,78,"$surface-subtle",6);WrapT(footer,"Return Target",disabled?action.disabledReason:"返回："+action.returnTarget+" · 流程锚点："+(action.flowAnchorPageId||model.sourcePageId),18,16,760,22,13,disabled?"$semantic-danger":"$text-secondary");const confirm=disabled?RawDisabledButton(footer,action.label,1010,22,140):RawButton(footer,action.label,1010,22,true,140);Update(confirm,{name:"Action/"+action.actionId+" -> "+(action.targetPageId||action.returnTarget||action.variantFrameId)+(disabled?" [disabled]":"")});}
const tableHeaderCells=["cmpTableHeaderCol0","cmpTableHeaderCol1","cmpTableHeaderCol2","cmpTableHeaderCol3","cmpTableHeaderCol4","cmpTableHeaderCol5"],tableRowCells=["cmpTableRowCell0","cmpTableRowCell1","cmpTableRowCell2","cmpTableRowCell3","cmpTableRowCell4","cmpTableRowCell5"];
function ApplyTableColumns(header,row,width){const spec=[0.17,0.22,0.15,0.19,0.12,0.15],labels=["编号","业务对象","责任人","更新时间","状态","操作"];let x=16;for(let i=0;i<spec.length;i++){const w=Math.floor((width-32)*spec[i]);Update(header+"/"+tableHeaderCells[i],{content:labels[i],x,width:w-10});if(row)Update(row+"/"+tableRowCells[i],{x,width:w-10,textAlign:i===5?"right":"left"});x+=w}}
function NavModel(s){let rootIndex=-1;for(let index=0;index<navigation.length;index++){if(navigation[index].root===s.root){rootIndex=index;break}}const normalizedIndex=Math.max(0,rootIndex);return {root:normalizedIndex,children:navigation[normalizedIndex].children,active:s.menu}}
function Shell(page,s){Insert(page,{type:"rectangle",name:"Sidebar",x:0,y:0,width:216,height:900,fill:"$brand-primary-dark"});T(page,"Brand","CNAS LIMS",24,18,160,20,"#FFFFFF","700");T(page,"Organization","华衡检测实验室",24,46,168,12,"#D6F4EF","400");const menus=navigation.map(item=>item.root),nav=NavModel(s);let menuY=92;for(const [i,m] of menus.entries()){if(i===nav.root)Insert(page,{type:"rectangle",name:"Active Root Menu",x:12,y:menuY,width:192,height:36,fill:"#FFFFFF20",cornerRadius:4});Ico(page,"Root Menu Icon",i===nav.root?"chevron-down":"chevron-right",28,menuY+11,i===nav.root?"#FFFFFF":"#BDE8E1",14);T(page,"Root Menu/"+m,m,52,menuY+8,140,14,"#FFFFFF",i===nav.root?"700":"400");menuY+=40;if(i===nav.root){for(const child of nav.children){if(child===nav.active)Insert(page,{type:"rectangle",name:"Active Submenu",x:28,y:menuY,width:168,height:30,fill:"#0F766E",cornerRadius:4});Insert(page,{type:"rectangle",name:"Submenu Guide",x:38,y:menuY+14,width:8,height:1,fill:child===nav.active?"#FFFFFF":"#8FD4CA"});T(page,"Submenu/"+child,child,54,menuY+7,136,13,child===nav.active?"#FFFFFF":"#D6F4EF",child===nav.active?"600":"400");menuY+=34}}menuY+=4}
Insert(page,{type:"rectangle",name:"Topbar",x:216,y:0,width:1224,height:56,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});Ico(page,"Search","search",240,20,"$text-secondary",16);T(page,"Global Search","搜索样品、任务、报告、文件",266,18,300,14,"$text-secondary");Ico(page,"Notifications","bell",1270,20,"$text-secondary",16);Ico(page,"User","circle-user-round",1324,18,"$brand-primary",20);T(page,"User Name","当前用户",1350,18,66,13,"$text-regular","500","right");Insert(page,{type:"rectangle",name:"Tabs",x:216,y:56,width:1224,height:36,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});T(page,"Tab",s.root+"  /  "+s.menu+(s.pageType==="操作页"?"  /  "+s.title:""),240,67,900,12,"$text-secondary")}
function Header(page,s){T(page,"Page Title",s.title,240,116,580,24,"$text-primary","700");T(page,"Page Goal",s.goal,240,150,580,13,"$text-secondary")}
function AppShell(page,s){
  Insert(page,{type:"rectangle",name:"Sidebar",x:0,y:0,width:216,height:900,fill:"$brand-primary-dark"});
  T(page,"Brand","CNAS LIMS",24,16,160,20,"#FFFFFF","700");T(page,"Organization","华衡检测实验室",24,43,168,12,"#D6F4EF","400");
  const nav=NavModel(s);let menuY=76;
  for(let i=0;i<navigation.length;i++){const m=navigation[i].root;
    const root=Insert(page,{type:"ref",name:"Navigation Root/"+m,ref:"cmpNavRoot",x:12,y:menuY,width:192,height:30});
    Update(root,{fill:i===nav.root?"#FFFFFF20":"$brand-primary-dark"});Update(root+"/cmpNavRootLabel",{content:m,fontWeight:i===nav.root?"700":"400"});menuY+=32;
    if(i===nav.root){for(const child of nav.children){
      const submenu=Insert(page,{type:"ref",name:"Navigation Submenu/"+child,ref:"cmpNavSubmenu",x:40,y:menuY,width:156,height:26});
      Update(submenu,{fill:child===nav.active?"#0F766E":"$brand-primary-dark"});Update(submenu+"/cmpNavSubmenuLabel",{content:child,fill:child===nav.active?"#FFFFFF":"#D6F4EF",fontWeight:child===nav.active?"600":"400"});menuY+=28;
    }}menuY+=2;
  }
  Insert(page,{type:"rectangle",name:"Topbar",x:216,y:0,width:1224,height:56,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});
  Ico(page,"Search","search",240,20,"$text-secondary",16);T(page,"Global Search","搜索样品、任务、报告、文件",266,18,300,14,"$text-secondary");
  Ico(page,"Notifications","bell",1270,20,"$text-secondary",16);Ico(page,"User","circle-user-round",1324,18,"$brand-primary",20);T(page,"User Name","当前用户",1350,18,66,13,"$text-regular","500","right");
  Insert(page,{type:"rectangle",name:"Tabs",x:216,y:56,width:1224,height:36,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});
  T(page,"Tab",s.root+"  /  "+s.menu+(s.pageType==="操作页"?"  /  "+s.title:""),240,67,900,12,"$text-secondary");
}
function Filters(page,s){const f=Insert(page,{type:"ref",name:"VbenForm Filters",ref:"cmpFilterBar",x:240,y:186,width:1176,height:112});Update(f+"/cmpFilterBarTitle",{content:"筛选条件",width:120});for(let i=0;i<3;i++)Field(page,s.fields[i]||"筛选条件",i===0?"请输入关键字":"请选择",258+i*250,232,230);Button(page,"查询",1032,254,true,84);Button(page,"重置",1124,254,false,84);Button(page,"更多筛选",1216,254,false,128)}
function Table(page,s,y=318,h=430){const panel=Box(page,"VxeTable",240,y,1176,h,"$surface-panel",6,"$border-light");const surface=Insert(panel,{type:"ref",name:"Table Layout Surface",ref:"cmpTableLayout",x:0,y:0,width:1176,height:h});Update(surface+"/cmpTableLayoutHeader",{width:1176});const toolbar=Insert(panel,{type:"ref",name:"Data List Toolbar",ref:"cmpListToolbar",x:0,y:0,width:1176,height:56});Update(toolbar+"/cmpListToolbarTitle",{content:s.title,width:420});Button(panel,"新增",950,12,true,84);Button(panel,"导出",1044,12,false,84);const header=Insert(panel,{type:"ref",name:"Table Header Instance",ref:"cmpTableHeader",x:0,y:72,width:1176,height:40});ApplyTableColumns(header,null,1176);for(let r=0;r<5;r++){const row=Insert(panel,{type:"ref",name:"Table Row Instance "+(r+1),ref:"cmpTableRow",x:0,y:112+r*48,width:1176,height:44});ApplyTableColumns(header,row,1176);if(r%2)Update(row,{fill:"$surface-subtle"})}
T(panel,"Pagination","共 58 条   20 条/页    1  2  3  下一页",820,h-32,330,12,"$text-secondary","400","right")}
function ApplyCompactTableColumns(header,row,width,values=[]){const spec=[0.28,0.30,0.24,0.18],labels=["编号","对象","结果","状态"];let x=12;for(let i=0;i<4;i++){const w=Math.floor((width-24)*spec[i]);Update(header+"/"+tableHeaderCells[i],{content:labels[i],x,width:w-10,opacity:1});if(row)Update(row+"/"+tableRowCells[i],{content:values[i],x,width:w-10,fill:i===3&&values[i]==="差异"?"$semantic-danger":"$text-regular",fontWeight:i===3?"600":"400",opacity:1});x+=w}for(let i=4;i<6;i++){Update(header+"/"+tableHeaderCells[i],{content:"",x:width,width:0,opacity:0});if(row)Update(row+"/"+tableRowCells[i],{content:"",x:width,width:0,opacity:0})}}
function CompactTable(p,x,y,w,rows=3){const table=Box(p,"Compact Business Table",x,y,w,42+rows*44,"$surface-panel",4,"$border-light");const surface=Insert(table,{type:"ref",name:"Compact Table Layout Surface",ref:"cmpTableLayout",x:0,y:0,width:w,height:42+rows*44});Update(surface+"/cmpTableLayoutHeader",{width:w});const header=Insert(table,{type:"ref",name:"Compact Table Header Instance",ref:"cmpTableHeader",x:0,y:0,width:w,height:40});ApplyCompactTableColumns(header,null,w);for(let r=0;r<rows;r++){const values=["LAB-0"+(r+1),"业务对象",r===1?"待复核":"已记录",r===2?"差异":"正常"],row=Insert(table,{type:"ref",name:"Compact Table Row Instance "+(r+1),ref:"cmpTableRow",x:0,y:40+r*44,width:w,height:44});Update(row,{fill:r%2?"$surface-subtle":"$surface-panel"});ApplyCompactTableColumns(header,row,w,values)}return table}
function Timeline(panel,x,y,width=320){T(panel,"Timeline Title","流程与审计留痕",x,y,width,15,"$text-primary","600");for(const [i,e] of ["10:12 提交申请 · 林审核","11:05 完成复核 · 周复核","当前 等待下一节点"].entries()){const item=Insert(panel,{type:"ref",name:"Workflow Timeline/"+(i+1),ref:"cmpTimelineItem",x,y:y+28+i*36,width,height:32});Update(item+"/cmpTimelineItemLabel",{content:e,width:width-40,fill:i===2?"$semantic-warning":"$text-regular",fontWeight:i===2?"600":"400"});if(i===2)Update(item,{fill:"$semantic-warning-bg"})}}
function Steps(panel,labels,y=22,width=1128,options={}){const scope=options.scope||"local",profile=activeSpec?.interactionProfile?.flow||{};if(scope==="local"&&Array.isArray(profile.steps)&&profile.steps.length)labels=profile.steps;const count=Math.max(labels.length,1),track=width/count,isGlobal=scope==="global",current=Math.min(count,Math.max(1,options.currentStep||profile.currentStep||1)),state=options.nodeState||profile.nodeState||"current",stepper=Insert(panel,{type:"ref",name:isGlobal?"Global Workflow Stepper":"Local Interaction Stepper",ref:"cmpWorkflowStepper",x:20,y,width,height:58});Update(stepper+"/cmpWorkflowStepperTrack",{x:track/2,y:14,width:width-track});for(let i=0;i<labels.length-1;i++)Insert(panel,{type:"rectangle",name:"Step Line",x:20+track*(i+.5)+14,y:y+14,width:Math.max(2,track-28),height:2,fill:i<current-1?"$brand-primary":"$border-base"});for(const [i,label] of labels.entries()){const x=20+i*track,done=i<current-1,active=i===current-1,tone=active&&state==="blocked"?"$semantic-danger":active&&state==="returned"?"$semantic-warning":done?"$semantic-success":active?"$brand-primary":"$border-base",step=Insert(panel,{type:"ref",name:(isGlobal?"Global Workflow Step/":"Local Interaction Step/")+(i+1),ref:"cmpWorkflowStep",x,y,width:track,height:56}),markerX=Math.max(0,(track-28)/2);Update(step+"/cmpWorkflowStepMarker",{x:markerX,y:0,fill:tone});Update(step+"/cmpWorkflowStepNumber",{content:String(i+1),x:markerX,y:7,width:28,fill:done||active?"$text-on-brand":"$text-secondary"});Update(step+"/cmpWorkflowStepLabel",{content:label,x:2,y:34,width:Math.max(24,track-4),height:20,fontSize:isGlobal?10:12,fill:done||active?"$text-primary":"$text-secondary",fontWeight:active?"600":"400",textAlign:"center",textGrowth:"fixed-width-height"});if(!done&&!active)Update(step,{opacity:.78})}}
function MetricCard(p,label,value,trend,tone,x,y){const colors={brand:"$brand-primary",success:"$semantic-success",warning:"$semantic-warning",danger:"$semantic-danger"};const b=Insert(p,{type:"ref",name:"Metric Card/"+label,ref:"cmpCardMetric",x,y,width:264,height:116});Update(b+"/cmpCardMetricLabel",{content:Safe(label)});Update(b+"/cmpCardMetricValue",{content:Safe(value)});Update(b+"/cmpCardMetricTrend",{content:Safe(trend),fill:colors[tone]});return b}
function Notification(p,tone,title,message,x,y,w=400){const refs={info:["cmpNotificationInfo","cmpNotificationInfoTitle","cmpNotificationInfoContent","cmpNotificationInfoClose"],success:["cmpNotificationSuccess","cmpNotificationSuccessTitle","cmpNotificationSuccessContent","cmpNotificationSuccessClose"],warning:["cmpNotificationWarning","cmpNotificationWarningTitle","cmpNotificationWarningContent","cmpNotificationWarningClose"],danger:["cmpNotificationDanger","cmpNotificationDangerTitle","cmpNotificationDangerContent","cmpNotificationDangerClose"]}[tone];const b=Insert(p,{type:"ref",name:"Notification Instance/"+tone,ref:refs[0],x,y,width:w,height:84});Update(b+"/"+refs[1],{content:Safe(title),width:Math.max(80,w-80)});Update(b+"/"+refs[2],{content:Safe(message),width:Math.max(100,w-80)});Update(b+"/"+refs[3],{x:Math.max(0,w-32)});return b}
function Dashboard(page,s){const vals=[["待处理任务","18","-3 较昨日","brand"],["样品按期率","96.8%","+1.2%","success"],["质量风险","4","2 项高风险","danger"],["资源预警","7","3 项临期","warning"]];for(const [i,v] of vals.entries())MetricCard(page,v[0],v[1],v[2],v[3],240+i*282,190);const chart=Box(page,"Trend Chart",240,326,744,400,"$surface-panel",6);T(chart,"Title","任务与样品趋势",18,18,300,16,"$text-primary","600");for(let i=0;i<7;i++){const h=80+i%3*24;Insert(chart,{type:"rectangle",name:"Bar",x:46+i*88,y:300-h,width:28,height:h,fill:i===6?"$brand-primary":"#99D5CF",cornerRadius:[4,4,0,0]});T(chart,"Day",String(i+21)+"日",34+i*88,316,52,11,"$text-secondary","400","center")}const side=Insert(page,{type:"ref",name:"Standard Card/重点风险与待办",ref:"cmpCardStandard",x:1004,y:326,width:412,height:400});Update(side+"/cmpCardStandardTitle",{content:"重点风险与待办"});Update(side+"/cmpCardStandardContent",{content:"5 项风险与待办需要按优先级处理。",width:360});Update(side+"/cmpCardStandardMeta",{content:""});for(const [i,e] of ["报告签发授权即将到期","环境监测点连续偏高","设备校准证书待复核","内审整改剩余 2 天","库存批次进入临期"].entries()){Tag(page,i<2?"高":"关注",1022,408+i*54,i<2?"danger":"warning");T(page,"Risk",e,1088,412+i*54,296,13,"$text-regular",i<2?"600":"400")}Notification(page,"warning","设备校准提醒","3 台关键设备将在 3 天后到期，请安排复核。",1004,746,412)}
function QueueView(page,s,mode="queue"){Filters(page,s);const title=mode==="todo"?"待办队列":mode==="message"?"消息队列":"待处理队列";const main=Box(page,title,240,318,760,430,"$surface-panel",6);T(main,"Title",title,18,18,300,16,"$text-primary","600");for(const [i,item] of ["高优先级 · 今日到期","待处理 · 需补充资料","待处理 · 等待复核","已转交 · 等待响应","已完成 · 可归档"].entries()){const rowY=58+i*64;Insert(main,{type:"rectangle",name:"Queue Row",x:18,y:rowY,width:724,height:56,fill:i===0?"#FEF0F0":i%2?"#FAFCFC":"#FFFFFF",cornerRadius:4});Tag(main,i===0?"高":i===4?"已完成":"待处理",32,rowY+14,i===0?"danger":i===4?"success":"warning");T(main,"Queue Subject",s.fields[(i+1)%s.fields.length]+" · LAB-260727-0"+(i+1),110,rowY+11,380,14,"$text-primary",i===0?"600":"400");T(main,"Queue Meta","责任人：林审核 · 截止 2026-07-28",110,rowY+33,420,12,"$text-secondary");T(main,"Queue Action",i===4?"查看":"处理",648,rowY+22,66,13,"$brand-primary","600","right")};const side=Box(page,"Queue Detail",1020,318,396,430,"$surface-panel",6);T(side,"Title","选中事项",18,18,220,16,"$text-primary","600");Tag(side,mode==="todo"?"待处理":"需关注",18,56,mode==="todo"?"warning":"danger");T(side,"Summary",s.goal,18,104,360,13,"$text-regular");T(side,"Audit","来源：工作台\n发起时间：2026-07-27 10:12\n处理人：当前用户",18,184,340,13,"$text-secondary");WarningAlert(side,"处理前须核对业务状态、权限和历史轨迹。",18,282,360);Button(side,mode==="todo"?"进入处理":"查看详情",238,376,true,140)}
function MessageCenter(page,s){Filters(page,s);const types=Box(page,"Message Categories",240,318,260,430,"$surface-panel",6);T(types,"Title","消息分类",18,18,180,16,"$text-primary","600");for(const [i,label] of ["全部消息","待处理","预警通知","系统公告","已归档"].entries()){const active=i===1;if(active)Insert(types,{type:"rectangle",name:"Active Category",x:16,y:56+i*48,width:228,height:36,fill:"$brand-primary-light-9",cornerRadius:4});T(types,"Category",label,30,67+i*48,150,13,active?"$brand-primary":"$text-regular",active?"600":"400");T(types,"Count",String([26,8,4,3,11][i]),190,67+i*48,34,12,"$text-secondary","400","right")};const list=Box(page,"Message List",520,318,516,430,"$surface-panel",6);T(list,"Title","消息列表",18,18,220,16,"$text-primary","600");for(const [i,label] of ["报告签发授权即将到期","样品接收异常待确认","内部审核证据待补充","接口同步已恢复"].entries()){const y=58+i*82;Insert(list,{type:"rectangle",name:"Message Row",x:18,y,width:480,height:70,fill:i===0?"#FDF6EC":"#FFFFFF",cornerRadius:4});Tag(list,i===0?"预警":i===3?"通知":"待处理",30,y+12,i===0?"warning":i===3?"info":"danger");T(list,"Subject",label,104,y+12,320,14,"$text-primary",i===0?"600":"400");T(list,"Meta","关联业务 LAB-260727 · 10:"+(12+i*8),104,y+36,342,12,"$text-secondary")};const detail=Box(page,"Message Detail",1056,318,360,430,"$surface-panel",6);T(detail,"Title","消息详情",18,18,200,16,"$text-primary","600");T(detail,"Content","当前授权范围将在 3 天后到期。请核对人员、领域和有效期后发起续期处理。",18,66,324,14,"$text-regular");T(detail,"State","阅读状态：未读\n关联对象：授权记录\n发送时间：2026-07-27 10:12",18,172,320,13,"$text-secondary");Button(detail,"标记已读",126,326,false,104);Button(detail,"查看关联业务",238,326,true,104)}
function Communication(page,s){const record=Box(page,"Communication Record",240,188,760,560,"$surface-panel",6);T(record,"Title","客户沟通记录",18,18,280,16,"$text-primary","600");for(let i=0;i<4;i++)Field(record,s.fields[i%s.fields.length],i===0?"华衡检测客户":i===1?"进度沟通":"请选择",18+(i%2)*360,62+Math.floor(i/2)*86,332);const content=Box(record,"Communication Content",18,252,724,152,"#FAFCFC",4,"$border-light");T(content,"Label","沟通内容",16,14,160,13,"$text-regular","600");T(content,"Value","已向客户说明当前检测进度、风险事项和预计交付时间；客户确认继续执行。",16,48,680,14,"$text-regular");Button(record,"保存草稿",506,476,false,104);Button(record,"提交记录",620,476,true,104);const history=Box(page,"Communication History",1020,188,396,560,"$surface-panel",6);Timeline(history,18,20);T(history,"History Note","历史记录按客户、关联委托和沟通类型受控查询。",18,182,350,13,"$text-secondary");Tag(history,"需跟进",18,238,"warning");WarningAlert(history,"涉及客户要求变更时，必须转入委托变更评审。",18,292,360)}
function ListDrawer(page,s){Filters(page,s);const list=Container(page,"Ledger List",240,318,790,430);T(list,"Title",s.title,18,18,300,16,"$text-primary","600");CompactTable(list,18,58,754,6);ActionFooter(list,0,374,790,null,"新增",true,0,112);const drawer=Box(page,"Ledger Detail Drawer",1050,318,366,430,"$surface-panel",6,"$border-light");const drawerSurface=Insert(drawer,{type:"ref",name:"Drawer Detail Surface",ref:"cmpDrawerDetail",x:0,y:0,width:366,height:430});Update(drawerSurface+"/cmpDrawerDetailTitle",{content:"选中记录详情"});for(const [i,label] of s.fields.slice(0,5).entries()){T(drawer,"Label",label,18,64+i*48,126,12,"$text-secondary","600");T(drawer,"Value",i===0?"LAB-260727-01":"已受控记录",150,64+i*48,190,13,"$text-regular")};WarningAlert(drawer,"修改前核对关联业务和有效状态。",18,282,330);ActionFooter(drawer,0,358,366,null,"查看完整档案",true,0,140)}
function ConfigPage(page,s){const basic=Box(page,"Configuration Basic",240,188,560,560,"$surface-panel",6);T(basic,"Title",s.title+"配置",18,18,300,16,"$text-primary","600");for(let i=0;i<5;i++)Field(basic,s.fields[i%s.fields.length],i===0?"LAB-SET-01":"请选择",18,62+i*78,524);const preview=Box(page,"Configuration Preview",820,188,596,560,"$surface-panel",6);T(preview,"Title","配置预览与校验",18,18,300,16,"$text-primary","600");const result=Box(preview,"Preview Result",18,58,560,180,"#FAFCFC",4,"$border-light");T(result,"Sample","LAB-20260728-001",18,20,500,20,"$brand-primary","700");T(result,"Help","保存前校验冲突、版本、生效范围和历史引用。",18,64,510,13,"$text-regular");WarningAlert(preview,"未通过校验的配置不能发布到生产业务流程。",18,264,560);T(preview,"Audit","版本：草稿 V1\n修改人：当前用户\n最近校验：2026-07-28 10:30",18,354,520,13,"$text-secondary");Button(preview,"保存草稿",330,476,false,104);Button(preview,"提交发布",446,476,true,104)}
function WorkflowDesigner(page,s){const palette=Box(page,"Workflow Node Palette",240,188,230,560,"$surface-panel",6);T(palette,"Title","流程节点",18,18,180,16,"$text-primary","600");for(const [i,label] of ["开始","审核","条件分支","通知","结束"].entries()){const node=Box(palette,"Node/"+label,18,58+i*58,194,42,i===1?"$brand-primary-light-9":"#FAFCFC",4,"$border-light");Ico(node,"Icon",["play","circle-check","git-branch","bell","flag"][i],14,13,i===1?"$brand-primary":"$text-secondary",16);T(node,"Label",label,42,14,128,13,"$text-regular","600")};const canvas=Box(page,"Workflow Canvas",490,188,630,560,"#FAFCFC",6,"$border-light");T(canvas,"Title","流程设计画布",18,18,260,16,"$text-primary","600");for(const [i,item] of ["发起申请","技术审核","批准发布"].entries()){const x=94+i*176;const node=Box(canvas,"Workflow Node",x,170,132,56,i===1?"$brand-primary-light-9":"#FFFFFF",6,i===1?"$brand-primary":"$border-base");T(node,"Label",item,12,20,108,13,i===1?"$brand-primary":"$text-regular","600","center");if(i<2)Insert(canvas,{type:"rectangle",name:"Connector",x:x+132,y:198,width:44,height:2,fill:"$brand-primary"})};const side=Box(page,"Workflow Properties",1140,188,276,560,"$surface-panel",6);T(side,"Title","节点属性",18,18,180,16,"$text-primary","600");Field(side,"办理角色","技术负责人",18,62,240);Field(side,"超时规则","24 小时",18,148,240);Field(side,"通知策略","请选择",18,234,240);WarningAlert(side,"发布前须校验无办理人、死循环和越权节点。",18,326,240);Button(side,"保存流程",132,476,true,126)}
function Form(page,s,mode="form"){const panel=Container(page,"Controlled Form",240,188,1176,600);Steps(panel,["基本信息","业务内容","复核确认","完成"],20,1128);if(mode==="review"||mode==="approval"||mode==="version"){const main=Box(panel,"Review Main",20,96,740,440,"$surface-panel",4,"$border-light");T(main,"Title",mode==="version"?"版本内容对比":"业务核验清单",18,16,300,16,"$text-primary","600");for(let i=0;i<6;i++){const label=s.fields[i%s.fields.length];Checkbox(main,label+"："+(i<4?"已核验":"需要补充"),18,58+i*52,i<4?"checked":"warning",650)}const side=Box(panel,"Approval Side",780,96,376,440,"$surface-subtle",4,"$border-light");Timeline(side,20,20,336);T(side,"Opinion Label","审批意见",20,166,120,13,"$text-regular","600");const op=Box(side,"Opinion",20,192,336,72,"$surface-panel",4,"$border-base");T(op,"Placeholder","请填写明确的审核意见",12,12,310,13,"$text-secondary");ActionFooter(side,0,384,376,"退回修改",mode==="approval"?"签名并发布":"提交审核",true,96,108)}else{for(let i=0;i<6;i++){const col=i%2,row=Math.floor(i/2);Field(panel,s.fields[i%s.fields.length],i===0?"LAB-260727-01":i===1?"华衡检测业务记录":"请选择",30+col*552,94+row*92,520)}const detail=Box(panel,"Dynamic Items",30,382,1076,110,"$surface-subtle",4,"$border-light");T(detail,"Title","明细项目",16,14,180,14,"$text-primary","600");T(detail,"Rows","项目 01    业务检测参数    方法版本 V2    数量 3    交付 5 个工作日",16,48,980,13);ActionFooter(panel,0,536,1176,"保存草稿","提交",true,106,106)}}
function Receive(page,s){const scanner=Container(page,"Sample Receive Scanner",240,188,312,580);T(scanner,"Title","扫码接收",18,18,180,16,"$text-primary","600");const scan=Box(scanner,"Scan Area",18,56,276,126,"$surface-selected",6,"$brand-primary");Ico(scan,"Scan Icon","scan-line",112,24,"$brand-primary",46);T(scan,"Hint","扫描样品或委托条码",30,82,216,13,"$text-regular","600","center");Field(scanner,"手工编号","LAB-S-260727",18,208,276);WarningAlert(scanner,"打印机离线时保留接收结果，可稍后补打标签。",18,304,276);ActionFooter(scanner,0,516,312,null,"查询",true,0,84);const main=Container(page,"Sample Receive Checklist",572,188,524,580);T(main,"Title","委托与接收核对",18,18,260,16,"$text-primary","600");Tag(main,"待核对",424,16,"warning");for(const [i,l] of ["数量与委托一致","包装和容器完好","温度条件符合","标识清晰可追溯","异常已由客户确认"].entries())Checkbox(main,l,18,62+i*48,i<4?"checked":"empty",410);CompactTable(main,18,318,488,2);ActionFooter(main,0,516,524,null,"确认接收",true,0,112);const label=Container(page,"Sample Label Preview",1116,188,300,580);T(label,"Title","标签与库位",18,18,180,16,"$text-primary","600");const preview=Box(label,"Label Preview",18,58,264,170,"$surface-panel",4,"$border-base");T(preview,"Code","LAB-S-260727-01",16,18,220,18,"$text-primary","700");Ico(preview,"QR","qr-code",84,56,"$text-primary",96);T(preview,"Meta","2-8℃ · 冷藏库 A-03",16,146,220,12,"$text-secondary","400","center");Field(label,"目标库位","冷藏库 A-03",18,258,264);WrapT(label,"Audit","接收人：陈样品\n接收时间：2026-07-27 10:26\n标签批次：LBL-07",18,358,250,54,13,"$text-regular");ActionFooter(label,0,516,300,null,"打印标签",false,0,116)}
function Schedule(page,s){const calendar=Box(page,"Resource Scheduling Board",240,188,816,580,"$surface-panel",6);T(calendar,"Title","资源排程与任务泳道",18,18,300,16,"$text-primary","600");for(const [i,d] of ["08:00","10:00","12:00","14:00","16:00"].entries())T(calendar,"Time",d,150+i*126,58,62,11,"$text-secondary","400","center");for(const [r,l] of ["林检测员","周复核员","设备 EQ-07","环境室 A"].entries()){T(calendar,"Lane",l,18,104+r*92,118,13,"$text-regular","600");Insert(calendar,{type:"rectangle",name:"Lane Line",x:142,y:98+r*92,width:648,height:1,fill:"$border-light"});const start=174+r*96;Insert(calendar,{type:"rectangle",name:"Task Bar",x:start,y:92+r*92,width:r===2?240:188,height:42,fill:r===2?"#FEF0F0":"#D9F1EE",stroke:r===2?"$semantic-danger":"$brand-primary",strokeWidth:1,cornerRadius:4});T(calendar,"Task",r===2?"设备占用冲突":"DEMO-TASK-0"+(r+1),start+12,105+r*92,r===2?210:164,12,r===2?"$semantic-danger":"$brand-primary","600")};Button(calendar,"批量分配",670,522,true,116);const side=Box(page,"Scheduling Conflicts",1076,188,340,580,"$surface-panel",6);T(side,"Title","冲突与阻断",18,18,220,16,"$text-primary","600");WarningAlert(side,"授权到期或设备时段重叠时禁止分配。",18,54,304);for(const [i,e] of ["设备 EQ-07 10:00-12:00 已占用","林检测员授权 3 天后到期","环境室 A 当前可用"].entries()){Tag(side,i===2?"可用":i===0?"阻断":"关注",18,132+i*76,i===2?"success":i===0?"danger":"warning");T(side,"Conflict",e,88,136+i*76,228,13,"$text-regular",i===0?"600":"400")};T(side,"Rule","冲突分配按钮保持禁用；解除后记录人员、设备和计划时间。",18,384,290,13,"$text-regular");DisabledButton(side,"冲突未解除",182,520,140)}
function RecordEditor(page,s){const left=Box(page,"Raw Record Context",240,188,250,580,"$surface-panel",6);T(left,"Title","任务与样品",18,18,180,16,"$text-primary","600");for(const [i,e] of ["任务 DEMO-T-017","样品 DEMO-S-031","项目 演示参数 A","方法 DEMO-M-V2"].entries())T(left,"Context",e,18,64+i*44,210,13,"$text-regular",i===0?"600":"400");WarningAlert(left,"设备校准失效时原始值录入被阻断。",18,260,214);Tag(left,"草稿 · 自动保存",18,338,"info");T(left,"Audit","更正需填写理由，保留前后值、操作者和时间。",18,390,210,13,"$text-regular");const grid=Box(page,"Raw Record Grid",510,188,616,580,"$surface-panel",6);T(grid,"Title","原始记录与自动计算",18,18,300,16,"$text-primary","600");CompactTable(grid,0,58,616,5);T(grid,"Formula","公式版本：CALC-DEMO-V2    计算值：12.68    判定：符合",18,372,560,13,"$text-primary","600");Field(grid,"更正理由","仅在更正时必填",18,410,580);Button(grid,"保存草稿",382,522,false,96);Button(grid,"提交复核",488,522,true,110);const right=Box(page,"Raw Record Resources",1146,188,270,580,"$surface-panel",6);T(right,"Title","资源与状态",18,18,180,16,"$text-primary","600");for(const [i,e] of [["方法版本","有效"],["设备 EQ-07","有效"],["环境 22.4℃","正常"],["物料 LOT-07","可用"]].entries()){T(right,"Resource",e[0],18,66+i*62,150,13,"$text-regular");Tag(right,e[1],176,60+i*62,i===0?"info":"success")};WarningAlert(right,"超范围输入需复核，归档后字段只读。",18,340,234);T(right,"Autosave","最近保存：10:32:18\n同步状态：已同步",18,430,220,13,"$text-secondary")}
function ImportData(page,s){const upload=Box(page,"Instrument Upload Queue",240,188,300,580,"$surface-panel",6);T(upload,"Title","仪器文件与映射",18,18,220,16,"$text-primary","600");const drop=Box(upload,"Upload Dropzone",18,58,264,120,"#F0F5F4",6,"$brand-secondary");Ico(drop,"Upload","upload-cloud",112,22,"$brand-secondary",40);T(drop,"Hint","拖入 CSV / 仪器文件",32,74,200,13,"$text-regular","600","center");Field(upload,"目标仪器","EQ-DEMO-07",18,204,264);Field(upload,"字段映射","样品号 → specimen_id",18,290,264);Tag(upload,"待对账",18,394,"warning");Button(upload,"开始解析",166,520,true,116);const reconcile=Box(page,"Import Reconciliation",560,188,548,580,"$surface-panel",6);T(reconcile,"Title","结果导入与对账",18,18,260,16,"$text-primary","600");CompactTable(reconcile,0,58,548,6);T(reconcile,"Summary","匹配 18 · 差异 3 · 重复 1 · 未识别 1",18,408,480,14,"$text-primary","600");Button(reconcile,"确认导入",412,520,true,116);const diff=Box(page,"Import Differences",1128,188,288,580,"$surface-panel",6);T(diff,"Title","差异与人工确认",18,18,220,16,"$text-primary","600");for(const [i,e] of [["重复数据","样品 017"],["单位不匹配","mg/L → μg/L"],["未识别样品","TEMP-009"]].entries()){Tag(diff,e[0],18,62+i*88,i===0?"danger":"warning");T(diff,"Diff",e[1],18,96+i*88,240,13,"$text-regular","600")};WarningAlert(diff,"人工确认必须记录确认人、处理结果和时间。",18,342,252);T(diff,"Audit","确认人：周复核（演示）\n处理：等待补充映射\n状态：已阻断导入",18,430,246,13,"$text-regular")}
function ReportEditor(page,s){const form=Box(page,"Report Composition",240,188,520,580,"$surface-panel",6);T(form,"Title","报告编制",18,18,220,16,"$text-primary","600");Tag(form,"模板 V2",412,16,"info");Field(form,"报告编号","DEMO-RPT-260727",18,62,484);Field(form,"判定结论","符合演示判定规则",18,148,484);Field(form,"声明与备注","请选择",18,234,484);T(form,"Readonly","客户、样品、方法和原始结果由系统自动带入，只读且可追溯。",18,326,470,13,"$text-secondary");WarningAlert(form,"认可标识不适用或结果缺项时禁止提交。",18,370,484);Button(form,"保存草稿",292,522,false,96);Button(form,"提交审核",398,522,true,104);const preview=Box(page,"Report Preview",780,188,636,580,"$surface-panel",6);T(preview,"Title","A4 实时预览",18,18,220,16,"$text-primary","600");const pages=Box(preview,"Page Thumbnails",18,58,96,468,"#FAFCFC",4);for(let i=0;i<3;i++){const thumb=Box(pages,"Page "+(i+1),14,18+i*142,68,112,"#FFFFFF",2,"$border-base");T(thumb,"No",String(i+1),26,46,16,12,"$text-secondary","600","center")};const paper=Box(preview,"A4 Paper",132,58,340,468,"#FFFFFF",4,"$border-base");T(paper,"Report Title","检 测 报 告（演示）",38,30,264,20,"$text-primary","700","center");T(paper,"Meta","报告编号：DEMO-RPT-260727\n客户：华衡演示客户\n样品：DEMO-S-031",28,86,284,12,"$text-regular");Insert(paper,{type:"rectangle",name:"Result Divider",x:28,y:166,width:284,height:1,fill:"$border-base"});T(paper,"Results","检测项目       结果       单位       判定\n演示参数 A     12.68      mg/L       符合\n演示参数 B     8.42       mg/L       符合",28,190,284,12,"$text-regular");T(paper,"Signature","审核：________    批准：________",28,410,284,12,"$text-secondary");const loading=Insert(preview,{type:"ref",name:"Template Loading Skeleton",ref:"cmpStateSkeleton",x:318,y:58,width:300,height:128});Update(loading,{opacity:0.7});T(preview,"Loading Label","模板加载状态",404,198,130,12,"$text-secondary","400","center")}
function TrainingSchedule(page,s){const calendar=Box(page,"Training Calendar",240,188,700,580,"$surface-panel",6);T(calendar,"Title","培训计划月历",18,18,220,16,"$text-primary","600");for(const [i,d] of ["周一","周二","周三","周四","周五"].entries())T(calendar,"Week",d,24+i*132,58,100,12,"$text-secondary","600","center");for(let r=0;r<4;r++)for(let c=0;c<5;c++){const cell=Box(calendar,"Calendar Cell",18+c*132,84+r*104,124,94,r===1&&c===2?"#E6FFFA":"#FAFCFC",4,"$border-light");T(cell,"Day",String(r*5+c+1),10,8,30,12,"$text-secondary");if((r+c)%3===0)Tag(cell,"培训",10,40,"brand")};const side=Box(page,"Training Execution",960,188,456,580,"$surface-panel",6);T(side,"Title","执行、考核与评价",18,18,260,16,"$text-primary","600");WarningAlert(side,"讲师资格未确认，发布计划保持禁用。",18,54,420);for(const [i,e] of [["参训人数","18"],["签到率","88%"],["考核通过","14"],["待评价","4"]].entries()){T(side,"Metric",e[0],18+(i%2)*204,136+Math.floor(i/2)*76,110,12,"$text-secondary");T(side,"Value",e[1],18+(i%2)*204,160+Math.floor(i/2)*76,110,22,"$text-primary","700")};const modal=Box(side,"Assessment Modal",18,302,420,164,"#FAFCFC",4,"$border-base");T(modal,"Title","考核结果加载状态",16,14,220,14,"$text-primary","600");Insert(modal,{type:"ref",name:"Training Assessment Skeleton",ref:"cmpStateSkeleton",x:60,y:30,width:300,height:128});DisabledButton(side,"发布计划（禁用）",270,520,168)}
function EquipmentSchedule(page,s){const calendar=Box(page,"Equipment Plan Calendar",240,188,796,580,"$surface-panel",6);T(calendar,"Title","校准 / 检定 / 维护 / 期间核查",18,18,360,16,"$text-primary","600");for(const [i,l] of ["校准","检定","维护","期间核查"].entries())Tag(calendar,l,18+i*96,54,["brand","success","warning","info"][i]);for(let r=0;r<4;r++)for(let c=0;c<6;c++){const cell=Box(calendar,"Plan Day",18+c*126,98+r*96,118,86,"#FAFCFC",4,"$border-light");T(cell,"Day",String(r*6+c+1),10,8,28,12,"$text-secondary");if((r+c)%4===0){Tag(cell,"EQ-0"+(c+1),10,38,r===2?"danger":"warning")}}Button(calendar,"批量建计划",646,522,true,128);const side=Box(page,"Equipment Plan Conflicts",1056,188,360,580,"$surface-panel",6);T(side,"Title","临期与冲突",18,18,220,16,"$text-primary","600");WarningAlert(side,"3 台设备计划临期，请确认责任人和服务窗口。",18,54,324);for(const [i,e] of ["EQ-07 校准剩余 7 天","EQ-03 维护人员时段冲突","EQ-11 期间核查待确认"].entries()){Tag(side,i===1?"冲突":"临期",18,132+i*76,i===1?"danger":"warning");T(side,"Plan",e,86,136+i*76,244,13,"$text-regular","600")};T(side,"Help","冲突提供调整入口；完成确认记录计划类型、完成日期和责任人。",18,378,318,13,"$text-regular");Button(side,"调整计划",226,520,true,116)}
function MatrixView(page,s){const isAcc=s.id==="G07",isEvidence=s.id==="G08";const left=Box(page,isAcc?"Accreditation Scope Tree":isEvidence?"Requirement Evidence Tree":"Authorization Scope Tree",240,188,256,580,"$surface-panel",6);T(left,"Title",isAcc?"认可范围树":isEvidence?"适用要求树":"授权范围树",18,18,190,16,"$text-primary","600");for(const [i,l] of (isAcc?["场所 A","对象类别","项目/参数","方法版本"]:isEvidence?["管理要求","组织与职责","文件和记录","技术要求","人员与设备"]:["检测项目","方法标准","仪器设备","授权场所"]).entries())T(left,"Tree Node",l,28+(isAcc?i*12:0),64+i*48,188-i*12,13,i===2?"$brand-primary":"$text-regular",i===2?"600":"400");if(isEvidence)Insert(left,{type:"ref",name:"Evidence Empty State",ref:"cmpStateEmpty",x:18,y:352,width:220,height:128});const main=Box(page,isAcc?"Accreditation Scope Matrix":isEvidence?"Evidence Compliance Matrix":"Personnel Authorization Matrix",516,188,644,580,"$surface-panel",6);T(main,"Title",isAcc?"范围与授权签字人矩阵":isEvidence?"条款自查与证据矩阵":"人员能力授权矩阵",18,18,320,16,"$text-primary","600");const legends=["有效","临期","暂停","未授权"],legendRefs=["cmpCheckboxChecked","cmpCheckboxWarning","cmpCheckboxDanger","cmpCheckboxEmpty"];for(const [i,l] of legends.entries()){Insert(main,{type:"ref",name:"Matrix Legend/"+l,ref:legendRefs[i],x:18+i*86,y:54,width:20,height:20});T(main,"Legend Label",l,44+i*86,57,44,12,"$text-regular","500")};const headers=isEvidence?["要求项","责任人","符合性","证据"]:isAcc?["人员","领域","场所","方法"]:["人员","项目","方法","设备"],widths=[188,138,138,138],offsets=[0,188,326,464];for(const [i,h] of headers.entries()){const header=Insert(main,{type:"ref",name:"Matrix Header/"+h,ref:"cmpMatrixCell",x:18+offsets[i],y:96,width:widths[i],height:44});Update(header,{fill:"$surface-muted"});Update(header+"/cmpMatrixCellLabel",{content:h,fill:"$text-regular",fontWeight:"600"})}for(let r=0;r<5;r++){const rowY=140+r*58;Insert(main,{type:"rectangle",name:"Matrix Row Divider",x:18,y:rowY+56,width:602,height:1,fill:"$border-light"});T(main,"Matrix Row",isEvidence?"要求 "+(r+1):"业务人员 "+(r+1),30,rowY+20,160,13,"$text-regular","500");for(let c=1;c<4;c++){const cellX=18+offsets[c],cell=Insert(main,{type:"ref",name:"Authorization Matrix Cell/"+r+"/"+c,ref:"cmpMatrixCell",x:cellX,y:rowY,width:widths[c],height:56});Update(cell,{fill:r%2?"#FAFCFC":"#FFFFFF"});Update(cell+"/cmpMatrixCellLabel",{content:""});const tone=(r+c)%4,ref=legendRefs[tone];Insert(main,{type:"ref",name:"Authorization Checkbox",ref,x:cellX+(widths[c]-24)/2,y:rowY+16,width:24,height:24})}}const footer=Box(main,"Matrix Footer",18,458,602,104,"#FAFCFC",4,"$border-light");T(footer,"Hint","选择授权状态后，变更原因、影响范围与操作人会写入审计记录。",16,18,420,13,"$text-secondary");Button(footer,isEvidence?"转内部审核":"变更授权",458,54,true,128);const side=Box(page,"Matrix Detail Drawer",1180,188,236,580,"$surface-panel",6);T(side,"Title","选中项详情",18,18,180,16,"$text-primary","600");T(side,"Detail",isEvidence?"证据数量：0\n缺口：责任证明\n符合性：待评价":"当前角色："+s.role+"\n范围：业务范围\n有效期：2026-12-31",18,64,198,13,"$text-regular");WarningAlert(side,isAcc?"授权与认可范围不匹配，不能签发。":isEvidence?"证据缺口可转入内部审核。":"暂停或撤权必须填写原因并记录影响任务。",18,172,200);Field(side,"变更原因","请选择",18,272,200);T(side,"Audit","操作、原因、影响范围和时间均记录审计。",18,378,198,13,"$text-secondary");if(isAcc)DisabledButton(side,"不能签发",92,520,126);else Button(side,isEvidence?"查看证据":"确认变更",92,520,true,126)}
function AuditExecution(page,s){const plan=Box(page,"Internal Audit Plan",240,188,300,580,"$surface-panel",6);T(plan,"Title","审核计划与审核组",18,18,230,16,"$text-primary","600");Field(plan,"审核范围","检测一组 / 资源管理",18,62,264);Field(plan,"主审员","林内审（演示）",18,148,264);const independence=Box(plan,"Audit Independence Alert",18,242,264,104,"#FDF6EC",4,"$semantic-warning");T(independence,"Title","职责分离检查",14,12,210,13,"#7A4C00","600");T(independence,"Message","内审员审核本人负责工作，必须阻断分配。",14,42,232,13,"#7A4C00");Tag(plan,"分配已阻断",18,374,"danger");Button(plan,"调整审核组",156,520,true,126);const checklist=Box(page,"Audit Checklist and Evidence",560,188,596,580,"$surface-panel",6);T(checklist,"Title","检查表执行与证据",18,18,260,16,"$text-primary","600");for(const [i,e] of ["职责文件已受控","人员授权证据完整","设备记录可追溯","整改措施已验证","现场证据待上传"].entries()){Insert(checklist,{type:"rectangle",name:"Audit Check",x:18,y:62+i*56,width:18,height:18,fill:i<3?"$brand-primary":"#FFFFFF",stroke:i<3?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(checklist,"Item",e,48,62+i*56,390,13,"$text-regular");Tag(checklist,i<3?"符合":i===3?"观察":"缺证据",470,58+i*56,i<3?"success":"warning")};const upload=Box(checklist,"Evidence Upload",18,358,560,96,"#FAFCFC",4,"$border-base");Ico(upload,"Upload","upload-cloud",18,26,"$brand-secondary",30);T(upload,"Hint","上传检查证据；失败时保留队列并支持重试",64,30,420,13,"$text-regular","600");Button(checklist,"保存检查表",438,520,true,140);const status=Box(page,"Audit Progress and Conclusion",1176,188,240,580,"$surface-panel",6);T(status,"Title","进度与结论",18,18,180,16,"$text-primary","600");T(status,"Progress","检查项 12/18\n证据 9\n不符合 2\n观察项 1",18,68,180,14,"$text-primary","600");Tag(status,"执行中",18,178,"brand");WarningAlert(status,"证据不足，暂不能完成审核。",18,228,204);T(status,"Audit State","范围调整、上传失败与重试均保留时间线。",18,330,198,13,"$text-regular");Button(status,"形成结论",94,520,false,128)}
function AuditLogView(page,s){Filters(page,s);const log=Box(page,"Readonly Audit Log",240,312,760,436,"$surface-panel",6);T(log,"Title","只读审计日志",18,18,260,16,"$text-primary","600");Tag(log,"不可编辑",620,16,"danger");CompactTable(log,0,56,760,6);T(log,"Mask","敏感值已掩码：证件号 ******2718",18,378,360,12,"$text-secondary");const side=Box(page,"Audit Before After Drawer",1020,312,396,436,"$surface-panel",6);T(side,"Title","操作前后值对比",18,18,240,16,"$text-primary","600");T(side,"Meta","主体：林审核（演示）\n对象：DEMO-RPT-017\n动作：报告字段更正\n来源：Web\n理由：客户确认更正",18,62,340,13,"$text-regular");const before=Box(side,"Before",18,194,168,112,"#FEF0F0",4);T(before,"Label","变更前",12,12,120,12,"$semantic-danger","600");T(before,"Value","结果：12.86\n状态：待签发",12,42,140,13,"$text-regular");const after=Box(side,"After",206,194,168,112,"#F0F9EB",4);T(after,"Label","变更后",12,12,120,12,"$semantic-success","600");T(after,"Value","结果：12.68\n状态：重新审核",12,42,140,13,"$text-regular");WarningAlert(side,"非审计角色禁止导出；导出行为本身也记录留痕。",18,330,356);Button(side,"申请导出权限",238,386,false,138)}
function Monitor(page,s){const vals=[[s.fields[0]||"在线对象","24","正常"],[s.fields[1]||"待处理","7","关注"],[s.fields[2]||"异常项","2","高风险"]];for(const [i,v] of vals.entries()){const b=Box(page,"Metric "+v[0],240+i*282,190,264,104,"$surface-panel",6);T(b,"Label",v[0],18,16,180,13,"$text-secondary");T(b,"Value",v[1],18,44,100,28,"$text-primary","700");Tag(b,v[2],150,52,i===2?"danger":i===1?"warning":"success")}const graph=Box(page,"Monitoring Trend",240,314,760,420,"$surface-panel",6);T(graph,"Title",s.title+"趋势",18,18,300,16,"$text-primary","600");for(let i=0;i<9;i++){const y=120+(i%4)*40;Insert(graph,{type:"ellipse",name:"Trend Point",x:50+i*72,y,width:10,height:10,fill:i===7?"$semantic-danger":"$brand-secondary"});if(i<8)Insert(graph,{type:"rectangle",name:"Trend Segment",x:58+i*72,y:y+4,width:66,height:2,fill:"#93B4E8"})}T(graph,"Threshold","--- 预警阈值",520,70,180,12,"$semantic-warning");const alarms=Box(page,"Alarm Queue",1020,190,396,544,"$surface-panel",6);T(alarms,"Title","异常与预警",18,18,220,16,"$text-primary","600");for(const [i,e] of ["接口同步失败，等待重试","临期对象剩余 7 天","阈值连续超限 12 分钟","人工重放等待审批","恢复成功并完成审计"].entries()){Tag(alarms,i===2?"阻断":i===4?"恢复":"关注",18,58+i*76,i===2?"danger":i===4?"success":"warning");T(alarms,"Alarm",e,88,61+i*76,278,13,"$text-regular",i===2?"600":"400");T(alarms,"Time","2026-07-27 "+(10+i)+":2"+i,88,84+i*76,250,11,"$text-secondary")}}
function Detail(page,s){const main=Container(page,"Detail Main",240,190,760,544);T(main,"Title",s.title+"详情",18,18,320,16,"$text-primary","600");for(let i=0;i<6;i++){T(main,"Label",s.fields[i%s.fields.length],18+(i%2)*360,64+Math.floor(i/2)*72,130,12,"$text-secondary");T(main,"Value",i===0?"LAB-260727-01":i===1?"华衡检测业务对象":"已记录并可追溯",18+(i%2)*360,86+Math.floor(i/2)*72,320,14,"$text-primary","500")}const steps=Box(main,"Process Steps",18,292,724,200,"$surface-subtle",4,"$border-light");Steps(steps,["创建","执行","复核","关闭"],20,680);T(steps,"Audit Title","最近留痕",28,86,120,13,"$text-primary","600");for(const [i,e] of ["10:12 提交申请 · 林审核","11:05 完成复核 · 周复核","当前 等待下一节点"].entries()){const item=Insert(steps,{type:"ref",name:"Detail Timeline/"+(i+1),ref:"cmpTimelineItem",x:28,y:110+i*30,width:520,height:28});Update(item+"/cmpTimelineItemLabel",{content:e,fill:i===2?"$semantic-warning":"$text-regular",fontWeight:i===2?"600":"400"});if(i===2)Update(item,{fill:"$semantic-warning-bg"})}const side=Container(page,"Related Information",1020,190,396,544);Timeline(side,22,22,352);WrapT(side,"Audit Note","所有关键操作记录操作者、时间、前后值和理由。",22,250,350,34,13,"$text-regular");Tag(side,"审计已开启",22,304,"success");ActionFooter(side,0,470,396,null,"查看审计日志",false,0,138)}
function Exception(page,s){const alert=Box(page,"Blocking Alert",240,188,1176,58,"#FEF0F0",4,"$semantic-danger");Ico(alert,"Alert Icon","octagon-alert",18,18,"$semantic-danger",22);T(alert,"Alert Message","检测到高风险异常，相关业务已阻断；完成影响评价和审批后方可继续。",54,18,900,14,"$semantic-danger","600");Tag(alert,"已阻断",1034,16,"danger");const main=Box(page,"Exception Form",240,266,760,468,"$surface-panel",6);for(let i=0;i<4;i++)Field(main,s.fields[i%s.fields.length],i===0?"偏离/异常":"已记录",22+(i%2)*360,22+Math.floor(i/2)*86,332);T(main,"Impact Title","影响评价",22,206,160,14,"$text-primary","600");const impact=Box(main,"Impact",22,232,716,112,"#FAFCFC",4);T(impact,"Impact Text","关联 3 个检测任务、1 份待签发报告；建议暂停并发起质量事件调查。",14,14,680,13,"$text-regular");Button(main,"保存处置",510,392,false,100);Button(main,"提交验证",620,392,"danger",118);const side=Box(page,"Exception Timeline",1020,266,396,468,"$surface-panel",6);Timeline(side,22,22);Tag(side,"CAPA 待建立",22,244,"warning");T(side,"Owner","责任部门：检测一组\n截止日期：2026-07-30\n验证人：周复核（演示）",22,290,330,13,"$text-regular")}
function States(page,s){const items=[["加载中","skeleton"],["空结果","empty"],["服务错误","danger"],["权限拒绝","warning"],["禁用操作","info"],["长文本与溢出","brand"]];for(const [i,it] of items.entries()){const col=i%3,row=Math.floor(i/3),b=Box(page,"State/"+it[0],240+col*392,190+row*250,368,222,"$surface-panel",6);T(b,"Title",it[0],18,18,240,16,"$text-primary","600");if(it[1]==="skeleton")Insert(b,{type:"ref",name:"State Skeleton Instance",ref:"cmpStateSkeleton",x:34,y:54,width:300,height:128});else if(it[1]==="empty")Insert(b,{type:"ref",name:"State Empty Instance",ref:"cmpStateEmpty",x:34,y:54,width:300,height:128});else{Ico(b,"State Icon","circle-alert",160,62,it[1]==="danger"?"$semantic-danger":"$semantic-warning",32);T(b,"State Text","当前状态保留业务上下文，并提供明确恢复或申请路径。",38,112,292,13,"$text-regular","400","center");Button(b,it[1]==="danger"?"重新加载":"查看处理路径",112,168,it[1]==="danger"?"danger":false,132)}}}
function DomainStateSamples(page,s){if(s.id==="B12")Insert(page,{type:"ref",name:"Instrument File Empty State",ref:"cmpStateEmpty",x:258,y:246,width:264,height:128});if(s.id==="R03")Insert(page,{type:"ref",name:"Authorization Filter Empty State",ref:"cmpStateEmpty",x:258,y:520,width:220,height:128});if(s.id==="G12")Insert(page,{type:"ref",name:"Interface Monitor Skeleton",ref:"cmpStateSkeleton",x:660,y:500,width:300,height:128})}
function Mobile(page,s){Insert(page,{type:"rectangle",name:"Mobile Topbar",x:0,y:0,width:390,height:52,fill:"$brand-primary"});Ico(page,"Back","chevron-left",14,17,"#FFFFFF",18);T(page,"Mobile Title",s.title,48,15,260,17,"#FFFFFF","600","center");Ico(page,"More","ellipsis",356,17,"#FFFFFF",18);T(page,"Organization","华衡检测实验室（演示）",16,66,260,12,"$text-secondary");if(s.id==="M03"){const scan=Box(page,"Mobile Sample Scanner",12,92,366,218,"#112F2D",8,"$brand-primary");Ico(scan,"Scan","scan-line",137,44,"#FFFFFF",92);T(scan,"Hint","将样品条码置于取景框内",54,154,258,14,"#FFFFFF","600","center");Tag(page,"相机权限已授权",12,326,"success");const summary=Box(page,"Mobile Sample Summary",12,364,366,154,"$surface-panel",6);T(summary,"Title","DEMO-S-260727-01",16,16,250,16,"$text-primary","700");T(summary,"Meta","委托：DEMO-ENT-017\n包装：完好    温度：2-8℃\n目标位置：冷藏库 A-03",16,52,320,13,"$text-regular");const handoff=Box(page,"Mobile Handoff Audit",12,534,366,104,"$surface-panel",6);T(handoff,"Title","交接责任记录",16,14,180,14,"$text-primary","600");T(handoff,"Meta","接收人：陈样品（演示）\n交接时间：2026-07-27 10:26",16,46,320,13,"$text-regular");Button(page,"确认接收与交接",210,662,true,168)}else if(s.id==="M04"){Tag(page,"离线暂存",12,92,"warning");const task=Box(page,"Mobile Task Steps",12,132,366,184,"$surface-panel",6);T(task,"Title","DEMO-TASK-017 · 当前步骤 2/4",16,16,320,15,"$text-primary","700");for(const [i,e] of ["核对样品","录入关键结果","上传附件","提交复核"].entries()){Tag(task,i<1?"完成":i===1?"当前":"待办",16,52+i*30,i<1?"success":i===1?"brand":"info");T(task,"Step",e,88,56+i*30,220,12,"$text-regular")};const record=Box(page,"Mobile Result Record",12,332,366,242,"$surface-panel",6);Field(record,"关键数值","12.68",16,18,334);Field(record,"单位","mg/L",16,104,158);Button(record,"拍照附件",190,126,false,144);WarningAlert(record,"设备状态待同步，提交前必须完成校验。",16,178,334);T(page,"Sync","最近同步：10:28 · 2 条记录待同步",12,594,330,12,"$text-secondary");Button(page,"离线暂存",82,662,false,120);Button(page,"提交复核",212,662,true,120)}else if(s.id==="M05"){const risk=Box(page,"Mobile Signing Block",12,92,366,92,"#FEF0F0",6,"$semantic-danger");T(risk,"Title","授权范围不匹配",16,14,240,15,"$semantic-danger","700");T(risk,"Message","当前签字授权不覆盖报告中的演示项目，不能签发。",16,44,330,13,"$semantic-danger");const report=Box(page,"Mobile Report Summary",12,200,366,150,"$surface-panel",6);T(report,"Title","DEMO-RPT-260727 · V2",16,16,280,16,"$text-primary","700");T(report,"Meta","客户：华衡演示客户\n样品：DEMO-S-031\n项目：演示参数 A、B\n提交人：赵编制（演示）",16,50,330,13,"$text-regular");const checks=Box(page,"Mobile Approval Checklist",12,366,366,176,"$surface-panel",6);for(const [i,e] of ["报告内容完整","结果已审核","认可标识适用","签字授权匹配"].entries()){Insert(checks,{type:"rectangle",name:"Check",x:16,y:18+i*38,width:18,height:18,fill:i<2?"$brand-primary":"#FFFFFF",stroke:i<2?"$brand-primary":"$semantic-danger",strokeWidth:1,cornerRadius:4});T(checks,"Item",e,48,19+i*38,270,13,i===3?"$semantic-danger":"$text-regular",i===3?"600":"400")};T(page,"History","10:12 提交 · 11:05 审核 · 当前等待授权校验",12,566,350,12,"$text-secondary");Button(page,"退回修改",82,662,"danger",120);DisabledButton(page,"禁止签发",212,662,166)}else if(s.kind==="mobileApproval"){WarningAlert(page,"审批前核验授权、完整性和历史意见。",12,92,366);const approval=Box(page,"Mobile Approval Summary",12,156,366,390,"$surface-panel",6);T(approval,"Title","待审批 · DEMO-APP-017",16,16,280,16,"$text-primary","700");for(const [i,e] of ["业务摘要已阅读","附件完整","历史意见已确认","电子签名状态有效"].entries()){Insert(approval,{type:"rectangle",name:"Check",x:16,y:62+i*52,width:18,height:18,fill:i<3?"$brand-primary":"#FFFFFF",stroke:i<3?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(approval,"Item",e,48,62+i*52,280,13,"$text-regular")};T(approval,"History","10:12 提交申请\n11:05 上一节点通过\n当前 等待签名确认",16,286,320,13,"$text-secondary");Button(page,"核验并审批",210,662,true,168)}else{WarningAlert(page,"1 项授权/资源风险需要关注",12,92,366);for(let i=0;i<4;i++){const c=Box(page,"Mobile Card "+(i+1),12,156+i*112,366,96,"$surface-panel",6);Tag(c,i===0?"高优先级":i===3?"已完成":"待处理",14,12,i===0?"danger":i===3?"success":"warning");T(c,"Card Title",s.fields[i%s.fields.length]+" · DEMO-0"+(i+1),14,44,250,15,"$text-primary","600");T(c,"Card Meta",i===3?"完成于 10:26":"截止 2026-07-28 · 林审核",14,70,280,12,"$text-secondary")};Button(page,s.kind==="mobileScan"?"扫码处置":"进入当前任务",210,662,true,168)}Insert(page,{type:"rectangle",name:"Bottom Navigation",x:0,y:788,width:390,height:56,fill:"$surface-panel",stroke:"$border-base",strokeWidth:{top:1}});for(const [i,l] of ["工作台","任务","扫码","我的"].entries())T(page,"Nav/"+l,l,12+i*96,812,80,12,i===0?"$brand-primary":"$text-secondary",i===0?"600":"400","center")}
function MobileV2(page,s){Insert(page,{type:"rectangle",name:"Mobile Topbar",x:0,y:0,width:390,height:52,fill:"$brand-primary"});Ico(page,"Back","chevron-left",14,17,"$text-on-brand",18);T(page,"Mobile Title",s.title,48,15,260,17,"$text-on-brand","600","center");Ico(page,"More","ellipsis",356,17,"$text-on-brand",18);T(page,"Organization","华衡检测实验室",16,66,260,12,"$text-secondary");if(s.id==="M03"){const scanner=Container(page,"Mobile Sample Scanner",12,92,366,218,"$surface-subtle");Ico(scanner,"Scan","scan-line",137,34,"$brand-primary",92);T(scanner,"Hint","将样品条码置于取景框内",54,150,258,14,"$text-regular","600","center");Tag(page,"相机权限已授权",12,326,"success");const summary=Container(page,"Mobile Sample Summary",12,364,366,188);T(summary,"Title","LAB-S-260727-01",16,16,250,16,"$text-primary","700");WrapT(summary,"Meta","委托：LAB-ENT-017\n包装：完好    温度：2-8℃\n目标位置：冷藏库 A-03\n接收人：陈样品",16,52,320,76,13,"$text-regular");ActionFooter(page,0,716,390,null,"确认接收与交接",true,0,168)}else if(s.id==="M04"){Tag(page,"离线暂存",12,92,"warning");const task=Container(page,"Mobile Task Steps",12,132,366,174);T(task,"Title","LAB-TASK-017 · 当前步骤 2/4",16,16,320,15,"$text-primary","700");for(const [i,e] of ["核对样品","录入关键结果","上传附件","提交复核"].entries())Checkbox(task,e,16,52+i*28,i<1?"checked":i===1?"warning":"empty",240);const record=Container(page,"Mobile Result Record",12,326,366,276);Field(record,"关键数值","12.68",16,18,334);Field(record,"单位","mg/L",16,104,158);Button(record,"拍照附件",190,126,false,144);WarningAlert(record,"设备状态待同步，提交前必须完成校验。",16,178,334);T(page,"Sync","最近同步：10:28 · 2 条记录待同步",12,622,330,12,"$text-secondary");ActionFooter(page,0,716,390,"离线暂存","提交复核",true,120,120)}else if(s.id==="M05"){DangerAlert(page,"签字授权不覆盖报告项目，当前不能签发。",12,92,366);const report=Container(page,"Mobile Report Summary",12,156,366,152);T(report,"Title","LAB-RPT-260727 · V2",16,16,280,16,"$text-primary","700");WrapT(report,"Meta","客户：华衡检测客户\n样品：LAB-S-031\n项目：业务参数 A、B\n提交人：赵编制",16,50,330,72,13,"$text-regular");const checks=Container(page,"Mobile Approval Checklist",12,324,366,250);for(const [i,e] of ["报告内容完整","结果已审核","认可标识适用","签字授权匹配"].entries())Checkbox(checks,e,16,18+i*44,i<2?"checked":i===3?"danger":"empty",270);ActionFooter(page,0,716,390,"退回修改","禁止签发",null,120,166)}else if(s.kind==="mobileApproval"){WarningAlert(page,"审批前核验授权、完整性和历史意见。",12,92,366);const approval=Container(page,"Mobile Approval Summary",12,168,366,400);T(approval,"Title","待审批 · LAB-APP-017",16,16,280,16,"$text-primary","700");for(const [i,e] of ["业务摘要已阅读","附件完整","历史意见已确认","电子签名状态有效"].entries())Checkbox(approval,e,16,62+i*52,i<3?"checked":"empty",280);WrapT(approval,"History","10:12 提交申请\n11:05 上一节点通过\n当前 等待签名确认",16,294,320,54,13,"$text-secondary");ActionFooter(page,0,716,390,null,"核验并审批",true,0,168)}else{WarningAlert(page,"1 项授权或资源风险需要关注",12,92,366);for(let i=0;i<4;i++){const card=Container(page,"Mobile Card "+(i+1),12,168+i*112,366,96);Tag(card,i===0?"高优先级":i===3?"已完成":"待处理",14,12,i===0?"danger":i===3?"success":"warning");T(card,"Card Title",s.fields[i%s.fields.length]+" · LAB-0"+(i+1),14,44,250,15,"$text-primary","600");T(card,"Card Meta",i===3?"完成于 10:26":"截止 2026-07-28 · 林审核",14,70,280,12,"$text-secondary")}ActionFooter(page,0,716,390,null,s.kind==="mobileScan"?"扫码处置":"进入当前任务",true,0,168)}Insert(page,{type:"rectangle",name:"Bottom Navigation",x:0,y:788,width:390,height:56,fill:"$surface-panel",stroke:"$border-base",strokeWidth:{top:1}});for(const [i,l] of ["工作台","任务","扫码","我的"].entries())T(page,"Nav/"+l,l,12+i*96,812,80,12,i===0?"$brand-primary":"$text-secondary",i===0?"600":"400","center")}
function Login(page,s){Insert(page,{type:"rectangle",name:"Brand Panel",x:0,y:0,width:560,height:900,fill:"$brand-primary-dark"});T(page,"Product","CNAS 实验室\n信息管理系统",72,160,410,32,"#FFFFFF","700");T(page,"Org","华衡检测实验室（演示）",72,270,360,16,"#D6F4EF","500");T(page,"Scope","通用 ISO/IEC 17025 检测/校准实验室演示环境",72,310,400,13,"#BDE8E1");for(const [i,l] of ["全过程可追溯","受控工作流","质量风险闭环"].entries()){Ico(page,"Check","circle-check",74,390+i*52,"#67C23A",20);T(page,"Feature",l,108,391+i*52,260,15,"#FFFFFF","500")};const form=Box(page,"Login Form",760,170,440,520,"$surface-panel",8,"$border-light");T(form,"Welcome","登录系统",40,42,300,24,"$text-primary","700");T(form,"Hint","使用演示账号进入需求评审环境",40,80,330,13,"$text-secondary");Field(form,"账号","HH-DEMO-017",40,126,360);Field(form,"密码","••••••••",40,212,360);Field(form,"验证码","请输入验证码",40,298,220);Tag(form,"演示环境",280,327,"brand");const btn=Box(form,"Login Button",40,402,360,42,"$brand-primary",4,"$brand-primary");T(btn,"Label","登 录",20,11,320,15,"#FFFFFF","700","center");T(form,"Audit","登录失败、锁定和访问范围均记录安全审计。",40,468,360,12,"$text-secondary")}
function ContractLogin(page,s){Insert(page,{type:"rectangle",name:"Brand Panel",x:0,y:0,width:560,height:900,fill:"$brand-primary-dark"});Insert(page,{type:"text",name:"Product",content:"CNAS 实验室\n信息管理系统",x:72,y:160,width:410,height:90,fontFamily:"$font-cn",fontSize:32,fontWeight:"700",fill:"#FFFFFF",textGrowth:"fixed-width-height"});Insert(page,{type:"text",name:"Organization",content:"华衡检测实验室",x:72,y:270,width:360,height:24,fontFamily:"$font-cn",fontSize:16,fontWeight:"500",fill:"#D6F4EF",textGrowth:"fixed-width-height"});const form=Insert(page,{type:"frame",name:"Login Form",x:760,y:170,width:440,height:520,fill:"$surface-panel",cornerRadius:8,stroke:"$border-light",strokeWidth:1,layout:"none",clip:true});Insert(form,{type:"text",name:"Welcome",content:"登录系统",x:40,y:42,width:300,height:34,fontFamily:"$font-cn",fontSize:24,fontWeight:"700",fill:"$text-primary",textGrowth:"fixed-width-height"});Insert(form,{type:"text",name:"Hint",content:"使用受控账号进入需求评审环境",x:40,y:82,width:330,height:22,fontFamily:"$font-cn",fontSize:13,fontWeight:"400",fill:"$text-secondary",textGrowth:"fixed-width-height"});Insert(form,{type:"ref",name:"Input Instance/账号",ref:"cmpFormInput",x:40,y:148,width:360,height:36});Insert(form,{type:"ref",name:"Input Instance/密码",ref:"cmpFormInput",x:40,y:234,width:360,height:36});Insert(form,{type:"ref",name:"Input Instance/验证码",ref:"cmpFormInput",x:40,y:320,width:220,height:36});Insert(form,{type:"rectangle",name:"Login Button",x:40,y:402,width:360,height:42,fill:"$brand-primary",cornerRadius:4});Insert(form,{type:"text",name:"Login Label",content:"登 录",x:60,y:413,width:320,height:22,fontFamily:"$font-cn",fontSize:15,fontWeight:"700",fill:"#FFFFFF",textAlign:"center",textGrowth:"fixed-width-height"});Insert(form,{type:"text",name:"Audit",content:"登录失败、锁定和访问范围均记录安全审计。",x:40,y:468,width:360,height:20,fontFamily:"$font-cn",fontSize:12,fontWeight:"400",fill:"$text-secondary",textGrowth:"fixed-width-height"})}
function Search(page,s){Filters(page,s);const panel=Box(page,"Search Results",240,312,1176,436,"$surface-panel",6);T(panel,"Summary","找到 128 条结果",18,18,220,16,"$text-primary","600");const cats=["全部 128","客户 18","样品 46","任务 31","报告 20","文件 13"];for(const [i,c] of cats.entries()){Tag(panel,c,18+i*112,52,i===0?"brand":"info")};for(let i=0;i<5;i++){Ico(panel,"Result Icon",["users","flask-conical","clipboard-list","file-text","book-open"][i],20,112+i*62,"$brand-secondary",20);T(panel,"Result Title",["客户","样品","任务","报告","文件"][i]+" · DEMO-260727-0"+(i+1),54,108+i*62,500,14,"$text-primary","600");T(panel,"Result Summary","匹配业务编号、名称和关键摘要；仅显示当前角色可访问内容。",54,132+i*62,720,12,"$text-secondary");Tag(panel,i===3?"部分字段受限":"可查看",980,114+i*62,i===3?"warning":"success")}}
function Permission(page,s){const tree=Container(page,"Organization Tree",240,190,300,544);T(tree,"Title","组织与菜单",18,18,180,16,"$text-primary","600");for(const [i,l] of ["华衡检测实验室","检测业务部","检测一组","质量管理部","体系与认可","系统管理"].entries()){T(tree,"Tree Node",(i>0?"  ".repeat(Math.min(i,2)):"")+"▸ "+l,18,60+i*54,250,13,i===4?"$brand-primary":"$text-regular",i===4?"600":"400")};const main=Container(page,"Permission Matrix",560,190,856,544);T(main,"Title",s.title,18,18,300,16,"$text-primary","600");for(const [i,l] of s.fields.entries()){T(main,"Dimension",l,18,66+i*66,180,13,"$text-regular","600");for(let c=0;c<4;c++){const checked=(i+c)%3!==0;Checkbox(main,["查看","新增","审核","管理"][c],210+c*130,62+i*66,checked?"checked":"empty",68)}}WarningAlert(main,"职责分离检查：编制、审核和批准不得由同一账号在同一流程中完成。",18,390,820);ActionFooter(main,0,476,856,null,"保存权限",true,0,128)}
function QualityChart(page,s){const chart=Box(page,"Quality Control Chart",240,190,820,544,"$surface-panel",6);T(chart,"Title","质控趋势与规则判定",18,18,320,16,"$text-primary","600");for(const [i,l] of [[90,"+3s"],[150,"+2s"],[270,"均值"],[390,"-2s"],[450,"-3s"]].entries()){Insert(chart,{type:"rectangle",name:"Control Line",x:56,y:l[0],width:720,height:1,fill:l[1]==="均值"?"$brand-primary":l[1].includes("3")?"$semantic-danger":"$semantic-warning"});T(chart,"Line Label",l[1],8,l[0]-7,42,11,"$text-secondary","400","right")};for(let i=0;i<12;i++){const yy=230+((i*37)%150)-75;Insert(chart,{type:"ellipse",name:"QC Point",x:70+i*58,y:yy,width:10,height:10,fill:i===9?"$semantic-danger":"$brand-secondary"})};const side=Box(page,"Rule Alerts",1080,190,336,544,"$surface-panel",6);T(side,"Title","规则与调查",18,18,220,16,"$text-primary","600");Tag(side,"失控",18,62,"danger");T(side,"Alert","第 10 点触发规则，相关批次已暂停。",18,102,298,13,"$text-regular","600");for(const [i,l] of ["确认质控品批次","核查设备状态","复核环境记录","评价样品结果"].entries())Checkbox(side,l,18,160+i*44,i<2?"checked":i===2?"warning":"empty",270);Button(side,"发起调查",190,468,true,126)}
function FlowBoard(board,model){const flows=model.type==="center"?model.flows:[model];T(board,"Flow Board Kicker",model.type==="center"?"模块流程中心":"核心流程总览",24,18,480,14,"$brand-primary","600");T(board,"Flow Board Title",model.title,24,42,960,26,"$text-primary","700");WrapT(board,"Flow Board Summary",model.type==="center"?"从本模块进入相关流程；每张节点卡均标记页面、责任角色、正常去向和退回/阻断处理。":model.summary,24,78,1120,34,13,"$text-secondary");Tag(board,model.type==="center"?"流程入口":""+model.id+" 受控闭环",1180,28,"brand");if(model.type==="center"){for(const [index,flow] of flows.entries()){const col=index%3,row=Math.floor(index/3),card=Box(board,"Flow Catalog/"+flow.id,24+col*464,136+row*168,440,142,"$surface-panel",6);Tag(card,flow.id,16,16,"brand");T(card,"Flow Title",flow.title,16,52,392,16,"$text-primary","600");WrapT(card,"Flow Summary",flow.summary,16,78,392,34,12,"$text-secondary");T(card,"Flow Entry","入口："+flow.nodes[0]+" · 终点："+flow.terminal,16,118,392,12,"$text-secondary")}}else{T(board,"Flow Roles","角色泳道："+model.roles,24,124,1080,14,"$text-regular","600");const nodeWidth=Math.max(96,Math.min(190,Math.floor((1392-(model.nodes.length-1)*14)/model.nodes.length)));for(const [index,pageId] of model.nodes.entries()){const pageSpec=specs.find(s=>s.id===pageId)||{title:"跨模块页面",role:"关联责任人"};const x=24+index*(nodeWidth+14);if(index>0)Insert(board,{type:"rectangle",name:"Flow Connector",x:x-14,y:235,width:14,height:2,fill:"$brand-primary"});const node=Box(board,"Flow Node/"+pageId,x,176,nodeWidth,154,index===model.nodes.length-1?"$semantic-success-bg":"$surface-panel",6,index===model.nodes.length-1?"$semantic-success":"$border-light");Tag(node,index===model.nodes.length-1?"归档终点":"节点 "+String(index+1),12,12,index===model.nodes.length-1?"success":index===0?"brand":"info");T(node,"Node Page",pageId,12,46,nodeWidth-24,14,"$brand-primary","700");WrapT(node,"Node Title",pageSpec.title,12,70,nodeWidth-24,34,13,"$text-primary","600");WrapT(node,"Node Role",pageSpec.role,12,112,nodeWidth-24,28,11,"$text-secondary")}const transition=Box(board,"Flow Transition Rules",24,374,860,180,"$surface-subtle",6);T(transition,"Title","页面跳转与异常回流",18,16,300,16,"$text-primary","600");WrapT(transition,"Normal","正常：按页面节点顺序进入下一页；当前节点保存草稿后保持上下文。",18,52,820,22,13,"$text-regular");WrapT(transition,"Returned","退回：记录退回原因、来源和目标节点，返回上一可编辑页面且保留原提交版本。",18,88,820,22,13,"$text-regular");WrapT(transition,"Blocked","阻断：前置条件、权限或关键证据缺失时停留当前节点，提供补齐证据、申请权限或进入异常处置入口。",18,124,820,36,13,"$text-regular");const audit=Box(board,"Flow Audit",910,374,506,180,"$surface-panel",6);T(audit,"Title","状态与审计",18,16,240,16,"$text-primary","600");Tag(audit,"待办处理中",18,52,"warning");T(audit,"State","详情 · 编辑 · 审核 · 发布/执行 · 退回 · 阻断 · 归档",18,90,460,13,"$text-regular");T(audit,"Reference","页面间以编号和来源/去向标注串联，不配置点击热点。",18,124,460,13,"$text-secondary")}}
function FlowLabels(s){const items=s.interactionProfile?.flow?.steps||(Array.isArray(s.flow)?s.flow:String(s.flow||"提交申请 → 核验条件 → 处理事项 → 完成").split("→"));return items.map(item=>String(item).trim()).filter(Boolean)}
function LocalSteps(panel,s,y=22,width=1128){const flow=s.interactionProfile?.flow||{},labels=FlowLabels(s),currentStep=Math.min(labels.length,Math.max(1,flow.currentStep||1));Steps(panel,labels,y,width,{scope:"local",currentStep,nodeState:flow.nodeState||"current"});return {currentStep,count:labels.length}}
function ApprovalWorkspace(page,s){const panel=Container(page,"Approval Decision Workspace",240,188,1176,600);LocalSteps(panel,s,20,1128);const main=Box(panel,"Decision Checklist",20,96,700,440,"$surface-panel",4,"$border-light");T(main,"Title","审批与受控决策",18,16,320,16,"$text-primary","600");WrapT(main,"Requirement",s.requirement,18,44,650,32,13,"$text-secondary");for(let i=0;i<5;i++){const y=94+i*56,complete=i<3;Checkbox(main,s.fields[i%s.fields.length]+(complete?" · 已核验":" · 需要确认"),18,y,complete?"checked":"empty",620)}const side=Box(panel,"Approval Audit",740,96,416,440,"$surface-subtle",4,"$border-light");Tag(side,"当前待决策",20,18,"warning");T(side,"Opinion Label","处理意见与电子签名",20,58,250,14,"$text-primary","600");const opinion=Box(side,"Approval Opinion",20,84,376,64,"$surface-panel",4,"$border-base");WrapT(opinion,"Placeholder","填写依据、影响范围和处理结论",12,14,340,34,13,"$text-secondary");Timeline(side,20,170,376);WarningAlert(side,"权限、前置条件或关键证据缺失时不能提交。",20,316,376);ActionFooter(side,0,384,416,"退回补充",s.interactionProfile?.modal?.action||"确认并提交",null,104,114)}
function WorkflowWorkspace(page,s){const panel=Container(page,"Workflow Action Workspace",240,188,1176,600),local=LocalSteps(panel,s,20,1128);const context=Box(panel,"Workflow Context",20,96,720,210,"$surface-subtle",4,"$border-light");T(context,"Title","当前操作与流转上下文",18,16,360,16,"$text-primary","600");T(context,"Entry",s.entry,18,48,660,13,"$text-secondary");for(let i=0;i<4;i++)Field(context,s.fields[i%s.fields.length],i===0?"LAB-260729-01":"请选择",18+(i%2)*344,82+Math.floor(i/2)*58,320);const checks=Box(panel,"Workflow Preconditions",20,326,720,210,"$surface-panel",4,"$border-light");T(checks,"Title","前置核验与受控事项",18,16,300,15,"$text-primary","600");for(const [i,label] of ["业务状态满足当前节点","关联资源与附件已核对","权限与职责分离已校验","操作原因和审计信息完整"].entries())Checkbox(checks,label,18,54+i*34,i<2?"checked":"empty",610);const side=Box(panel,"Workflow Audit",760,96,396,440,"$surface-subtle",4,"$border-light");Tag(side,"局部步骤 "+local.currentStep+" / "+local.count,20,18,"brand");Timeline(side,20,62,356);WarningAlert(side,"存在阻断项时仅允许保存草稿或退回处理。",20,210,356);WrapT(side,"Requirement",s.requirement,20,290,356,42,13,"$text-secondary");ActionFooter(side,0,384,396,"保存草稿",s.interactionProfile?.modal?.action||"提交下一步",null,104,106)}
function VerificationWorkspace(page,s){const panel=Container(page,"Verification Workbench",240,188,1176,600);LocalSteps(panel,s,16,1128);const metrics=[[s.fields[0]||"待核验项","12","正常","success"],[s.fields[1]||"关联资源","4","需确认","warning"],[s.fields[2]||"阻断风险","1","阻断","danger"]];for(const [i,item] of metrics.entries()){const card=Box(panel,"Verification Metric",20+i*238,82,218,86,"$surface-panel",4,"$border-light");T(card,"Label",item[0],14,12,170,12,"$text-secondary");T(card,"Value",item[1],14,36,70,24,"$text-primary","700");Tag(card,item[2],122,44,item[3])}const data=Box(panel,"Verification Data",20,188,720,348,"$surface-panel",4,"$border-light");T(data,"Title","数据、资源与规则核验",18,16,340,16,"$text-primary","600");for(let i=0;i<4;i++)Field(data,s.fields[i%s.fields.length],i===0?"12.680":"已关联",18+(i%2)*344,60+Math.floor(i/2)*76,320);CompactTable(data,18,198,684,2);const side=Box(panel,"Verification Result",760,188,396,348,"$surface-subtle",4,"$border-light");Tag(side,"发现 1 项阻断",20,18,"danger");T(side,"Title","核验结论",20,58,180,16,"$text-primary","600");WrapT(side,"Summary","关键资源或判定规则不满足时，结果不能进入下一流程节点。",20,92,350,34,13,"$text-regular");Timeline(side,20,142,356);WarningAlert(side,"请补充证据或发起复检后再提交。",20,230,356);ActionFooter(side,0,292,396,"保存核验","提交结果",null,104,106)}
function LifecycleWorkspace(page,s){const panel=Container(page,"Lifecycle Version Workspace",240,188,1176,600);Steps(panel,["创建版本","内容比对","受控审批","发布归档"],20,1128);const compare=Box(panel,"Version Comparison",20,96,760,440,"$surface-panel",4,"$border-light");T(compare,"Title","版本关系与变更影响",18,16,320,16,"$text-primary","600");for(const [i,item] of [["原版本","V1 · 已发布"],["当前版本","V2 · 待批准"],["变更原因",s.goal],["影响范围",s.requirement]].entries()){const y=60+i*72;T(compare,"Version Label",item[0],18,y,100,12,"$text-secondary","600");WrapT(compare,"Version Value",item[1],132,y,590,32,13,i<2?"$text-primary":"$text-regular",i<2?"600":"400");Insert(compare,{type:"rectangle",name:"Version Divider",x:18,y:y+48,width:724,height:1,fill:"$border-light"})}const side=Box(panel,"Lifecycle Audit",800,96,356,440,"$surface-subtle",4,"$border-light");Tag(side,"版本受控",20,18,"info");Timeline(side,20,60,316);WarningAlert(side,"发布、更正、撤回或作废均需保留版本关系和通知记录。",20,210,316);ActionFooter(side,0,384,356,"保存草稿","提交受控审批",true,104,106)}
function RenderPage(page,s){if(s.kind==="login")return ContractLogin(page,s);try{AppShell(page,s)}catch(error){throw new Error("shell: "+error.message)}try{Header(page,s)}catch(error){throw new Error("header: "+error.message)}if(s.kind.indexOf("mobile")===0)return;try{switch(s.kind){case"dashboard":return Dashboard(page,s);case"states":return States(page,s);case"search":return Search(page,s);case"permission":return Permission(page,s);case"monitor":return Monitor(page,s);case"qualityChart":return QualityChart(page,s);case"receive":return Receive(page,s);case"record":return RecordEditor(page,s);case"import":return ImportData(page,s);case"report":case"reportEditor":case"preview":return ReportEditor(page,s);case"schedule":return s.menu==="培训管理"?TrainingSchedule(page,s):s.menu==="设备管理"?EquipmentSchedule(page,s):Schedule(page,s);case"matrix":case"tree":return MatrixView(page,s);case"audit":return AuditExecution(page,s);case"auditLog":return AuditLogView(page,s);case"review":case"approval":case"changeReview":case"contract":case"accreditationCheck":case"todoAction":return Form(page,s,"review");case"version":case"versionDetail":case"correction":case"withdrawal":return Form(page,s,"version");case"form":case"wizard":case"aliquot":case"handover":case"checkout":case"retention":case"disposal":case"startTask":case"calculation":case"resourceCheck":case"retest":case"qualityControl":case"closeout":case"delivery":case"archive":case"config":case"workflow":case"label":case"storage":return Form(page,s,"form");case"exception":case"capa":return Exception(page,s);case"detail":case"trace":case"profile":case"resultSummary":return Detail(page,s);default:Filters(page,s);return Table(page,s)}}catch(error){throw new Error("content: "+error.message)}}
function InteractionProfileSummary(page,s){const context=s.flowContext||(s.flowContexts||[]).find(item=>item.flowId===s.primaryFlowId)||(s.flowContexts||[])[0],labels=context?.steps||[];if(!labels.length)return;const panel=Box(page,"Top Global Flow Stepper",850,100,566,76,"$surface-subtle",4,"$border-light");Steps(panel,labels,8,526,{scope:"global",currentStep:context?.nodeIndex||1,nodeState:context?.nodeState||"current"});Tag(panel,(context?.flowId||"流程")+" "+(context?.nodeIndex||1)+" / "+(context?.nodeCount||labels.length),8,46,context?.nodeState==="blocked"?"danger":context?.nodeState==="returned"?"warning":"brand")}
function renderEnhanced(page,s){const family={approval:()=>ApprovalWorkspace(page,s),workflow:()=>WorkflowWorkspace(page,s),verification:()=>VerificationWorkspace(page,s),lifecycle:()=>LifecycleWorkspace(page,s)}[s.renderFamily];if(family){AppShell(page,s);Header(page,s);family();InteractionProfileSummary(page,s);return}const custom={todoList:()=>QueueView(page,s,"todo"),queue:()=>QueueView(page,s,"queue"),messageCenter:()=>MessageCenter(page,s),communication:()=>Communication(page,s),listDrawer:()=>ListDrawer(page,s),config:()=>ConfigPage(page,s),workflow:()=>WorkflowDesigner(page,s)}[s.kind];if(custom){AppShell(page,s);Header(page,s);custom();if(!s.id.startsWith("M"))InteractionProfileSummary(page,s);return}RenderPage(page,s);if(!s.id.startsWith("M")&&s.kind!=="login")InteractionProfileSummary(page,s)}
let activeSpec=null;
function ActionContract(label){return (activeSpec?.actionContracts||[]).find(action=>action.label===label||(action.aliases||[]).indexOf(label)>=0)}
function ActionTarget(action){return action?.targetPageId||action?.variantFrameId||action?.effect||"local-ui"}
function ActionName(label,disabled=false){const action=ActionContract(label);const actionId=action?.actionId||(activeSpec?activeSpec.id+".utility."+String(label).split(" ").join("-"):"board.utility."+String(label).split(" ").join("-"));return (action?"Action/":"Utility Action/")+actionId+" -> "+ActionTarget(action)+(disabled?" [disabled]":"")}
function ActionContractBar(page,s,mobile=false){const actions=s.actionContracts||[];if(!actions.length)return;const cols=mobile?2:8,rows=Math.ceil(actions.length/cols),x=mobile?12:240,y=mobile?690:784,w=mobile?366:1176,h=mobile?Math.max(138,34+rows*40):108,buttonWidth=mobile?158:126,panel=Insert(page,{type:"frame",name:"Visible Action Contracts",x,y,width:w,height:h,fill:"$surface-panel",cornerRadius:6,stroke:"$border-light",strokeWidth:1,layout:"none",clip:true});Insert(panel,{type:"text",name:"Action Contract Title",content:"页面操作",x:12,y:8,width:mobile?80:100,height:18,fontFamily:"$font-cn",fontSize:12,fontWeight:"600",fill:"$text-secondary",textGrowth:"fixed-width-height"});for(let index=0;index<actions.length;index++){const action=actions[index],disabled=action.controlState==="disabled",col=index%cols,row=Math.floor(index/cols),target=action.targetPageId||action.variantFrameId||action.effect||"local-ui",buttonX=12+col*(buttonWidth+(mobile?14:16)),buttonY=30+row*40,primary=index===0&&!disabled;Insert(panel,{type:"rectangle",name:"Action/"+action.actionId+" -> "+target+(disabled?" [disabled]":""),x:buttonX,y:buttonY,width:buttonWidth,height:34,fill:disabled?"$surface-muted":primary?"$brand-primary":"$surface-panel",stroke:disabled?"$border-light":primary?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});Insert(panel,{type:"text",name:"Action Label/"+action.actionId,content:String(action.label),x:buttonX+8,y:buttonY+8,width:buttonWidth-16,height:18,fontFamily:"$font-cn",fontSize:13,fontWeight:primary?"600":"400",fill:disabled?"$text-disabled":primary?"#FFFFFF":"$text-regular",textAlign:"center",textGrowth:"fixed-width-height"});} }
for(const [i,s] of desktop.entries()){try{const index=i+frameOffset,cols=2,x=(index%cols)*1500,y=pageStartY+Math.floor(index/cols)*960;const page=Insert(document,{type:"frame",name:s.id+" "+s.title,x,y,width:1440,height:900,fill:"$surface-page",layout:"none",clip:true,placeholder:true});activeSpec=s;try{renderEnhanced(page,s)}catch(error){throw new Error("render: "+error.message)}try{DomainStateSamples(page,s)}catch(error){throw new Error("states: "+error.message)}try{ActionContractBar(page,s)}catch(error){throw new Error("actions: "+error.message)}activeSpec=null;Update(page,{placeholder:false})}catch(error){throw new Error("Page "+s.id+" failed: "+error.message)}}
for(const [i,s] of mobile.entries()){try{const index=i+frameOffset,x=3060+(index%4)*420,y=pageStartY+Math.floor(index/4)*904;const page=Insert(document,{type:"frame",name:s.id+" "+s.title,x,y,width:390,height:844,fill:"$surface-page",layout:"none",clip:true,placeholder:true});activeSpec=s;MobileV2(page,s);ActionContractBar(page,s,true);activeSpec=null;Update(page,{placeholder:false})}catch(error){throw new Error("Mobile page "+s.id+" failed: "+error.message)}}
let boardY=pageStartY+Math.ceil(desktop.length/2)*960+Math.ceil(mobile.length/4)*904+120;
for(const stateBoard of stateBoards){try{const board=Insert(document,{type:"frame",name:stateBoard.name,x:0,y:boardY,width:1440,height:900,fill:"$surface-page",layout:"none",clip:true,placeholder:true});activeSpec=specs.find(s=>s.id===stateBoard.sourcePageId)||null;ActionStateBoard(board,stateBoard);activeSpec=null;Update(board,{placeholder:false});boardY+=960}catch(error){throw new Error("State "+stateBoard.id+" failed: "+error.message)}}
for(const flowBoard of flowBoards){const board=Insert(document,{type:"frame",name:flowBoard.name,x:0,y:boardY,width:1440,height:900,fill:"$surface-page",layout:"none",clip:true,placeholder:true});FlowBoard(board,flowBoard);Update(board,{placeholder:false});boardY+=960}
if(includeInteractionBoard){const board=Insert(document,{type:"frame",name:boardSpec.name,x:0,y:boardY,width:1440,height:900,fill:"$surface-page",layout:"none",clip:true,placeholder:true});InteractionStateBoard(board,boardSpec);Update(board,{placeholder:false})}
if(includeContactSheet)Update(sheet,{placeholder:false})
})();
`;
  const compatibleOperations = operations.replaceAll('.entries()', '.map((value,index)=>[index,value])');
  return Object.entries(componentIds)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((script, [placeholder, id]) => script.replaceAll(placeholder, id), compatibleOperations);
}

function command(name, args) {
  return `${name}(${JSON.stringify(args)})`;
}

function extractJsonObjects(raw) {
  const clean = raw.replace(ANSI_RE, '');
  const objects = [];
  for (let start = 0; start < clean.length; start += 1) {
    if (clean[start] !== '{') continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let end = start; end < clean.length; end += 1) {
      const char = clean[end];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
      if (depth !== 0) continue;
      try {
        objects.push(JSON.parse(clean.slice(start, end + 1)));
      } catch {
        // Ignore non-JSON brace blocks emitted by the CLI.
      }
      start = end;
      break;
    }
  }
  return objects;
}

function componentIdMap(raw) {
  const componentResponse = extractJsonObjects(raw).find((response) =>
    Array.isArray(response.nodes) && response.nodes.some((node) => node.reusable),
  );
  if (!componentResponse) throw new Error('Reusable component IDs were not returned by Pencil');
  const byName = new Map(componentResponse.nodes.map((node) => [node.name, node]));
  const root = (name) => {
    const node = byName.get(name);
    if (!node) throw new Error(`Missing reusable component: ${name}`);
    return node;
  };
  const child = (name, childName) => {
    const node = root(name).children?.find((candidate) => candidate.name === childName);
    if (!node) throw new Error(`Missing reusable component child: ${name}/${childName}`);
    return node.id;
  };
  const children = (name, childName) => {
    const nodes = root(name).children?.filter((candidate) => candidate.name === childName) ?? [];
    if (!nodes.length) throw new Error(`Missing reusable component children: ${name}/${childName}`);
    return nodes.map((node) => node.id);
  };
  const descendant = (name, childName) => {
    const visit = (nodes) => {
      for (const node of nodes ?? []) {
        if (node.name === childName || node.id === childName) return node.id;
        const found = visit(node.children);
        if (found) return found;
      }
      return null;
    };
    const id = visit(root(name).children);
    if (!id) throw new Error(`Missing reusable component descendant: ${name}/${childName}`);
    return id;
  };
  const descendantPath = (name, path) => {
    let nodes = root(name).children ?? [];
    for (const segment of path) {
      const node = nodes.find((candidate) => candidate.name === segment);
      if (!node) throw new Error(`Missing reusable component descendant: ${name}/${path.join('/')}`);
      if (segment !== path.at(-1)) nodes = node.children ?? [];
      else return node.id;
    }
    throw new Error(`Missing reusable component descendant: ${name}/${path.join('/')}`);
  };
  const skeletonLines = children('State/Skeleton', 'Skeleton Line');
  if (skeletonLines.length < 3) throw new Error('State/Skeleton must contain three Skeleton Line children');
  return {
    cmpButtonPrimary: root('Button/Primary').id,
    cmpButtonPrimaryLabel: child('Button/Primary', 'Label'),
    cmpButtonSecondary: root('Button/Secondary').id,
    cmpButtonSecondaryLabel: child('Button/Secondary', 'Label'),
    cmpButtonDanger: root('Button/Danger').id,
    cmpButtonDangerLabel: child('Button/Danger', 'Label'),
    cmpButtonDisabled: root('Button/Disabled').id,
    cmpButtonDisabledLabel: child('Button/Disabled', 'Label'),
    cmpFormInput: root('Form/Input').id,
    cmpFormInputValue: child('Form/Input', 'Placeholder'),
    cmpTagSuccess: root('Tag/Success').id,
    cmpTagSuccessLabel: child('Tag/Success', 'Label'),
    cmpTagWarning: root('Tag/Warning').id,
    cmpTagWarningLabel: child('Tag/Warning', 'Label'),
    cmpTagDanger: root('Tag/Danger').id,
    cmpTagDangerLabel: child('Tag/Danger', 'Label'),
    cmpTagInfo: root('Tag/Info').id,
    cmpTagInfoLabel: child('Tag/Info', 'Label'),
    cmpAlertWarning: root('Alert/Warning').id,
    cmpAlertWarningMessage: child('Alert/Warning', 'Message'),
    cmpAlertWarningCompact: root('Alert/Warning/Compact').id,
    cmpAlertWarningCompactMessage: child('Alert/Warning/Compact', 'Message'),
    cmpAlertDanger: root('Alert/Danger').id,
    cmpAlertDangerMessage: child('Alert/Danger', 'Message'),
    cmpTableHeader: root('Table/Header').id,
    cmpTableHeaderCol0: child('Table/Header', 'Column 编号'),
    cmpTableHeaderCol1: child('Table/Header', 'Column 业务对象'),
    cmpTableHeaderCol2: child('Table/Header', 'Column 责任人'),
    cmpTableHeaderCol3: child('Table/Header', 'Column 更新时间'),
    cmpTableHeaderCol4: child('Table/Header', 'Column 状态'),
    cmpTableHeaderCol5: child('Table/Header', 'Column 操作'),
    cmpTableRow: root('Table/Row').id,
    cmpTableRowCell0: child('Table/Row', 'Cell 0'),
    cmpTableRowCell1: child('Table/Row', 'Cell 1'),
    cmpTableRowCell2: child('Table/Row', 'Cell 2'),
    cmpTableRowCell3: child('Table/Row', 'Cell 3'),
    cmpTableRowCell4: child('Table/Row', 'Cell 4'),
    cmpTableRowCell5: child('Table/Row', 'Cell 5'),
    cmpStateSkeleton: root('State/Skeleton').id,
    cmpStateSkeletonLine0: skeletonLines[0],
    cmpStateSkeletonLine1: skeletonLines[1],
    cmpStateSkeletonLine2: skeletonLines[2],
    cmpStateEmpty: root('State/Empty').id,
    cmpSwitchOn: root('Form/Switch/On').id,
    cmpSwitchOff: root('Form/Switch/Off').id,
    cmpNavRoot: root('Navigation/RootItem').id,
    cmpNavRootLabel: child('Navigation/RootItem', 'Label'),
    cmpNavSubmenu: root('Navigation/SubmenuItem').id,
    cmpNavSubmenuLabel: child('Navigation/SubmenuItem', 'Label'),
    cmpWorkflowStep: root('Workflow/Step').id,
    cmpWorkflowStepMarker: child('Workflow/Step', 'Marker'),
    cmpWorkflowStepNumber: child('Workflow/Step', 'Number'),
    cmpWorkflowStepLabel: child('Workflow/Step', 'Label'),
    cmpWorkflowStepper: root('Workflow/Stepper').id,
    cmpWorkflowStepperTrack: child('Workflow/Stepper', 'Track'),
    cmpTimelineItem: root('Workflow/TimelineItem').id,
    cmpTimelineItemLabel: child('Workflow/TimelineItem', 'Event'),
    cmpFilterBar: root('Form/FilterBar').id,
    cmpFilterBarTitle: child('Form/FilterBar', 'Title'),
    cmpListToolbar: root('Data/ListToolbar').id,
    cmpListToolbarTitle: child('Data/ListToolbar', 'Title'),
    cmpCheckboxChecked: root('Form/Checkbox/Checked').id,
    cmpCheckboxWarning: root('Form/Checkbox/Warning').id,
    cmpCheckboxDanger: root('Form/Checkbox/Danger').id,
    cmpCheckboxEmpty: root('Form/Checkbox/Empty').id,
    cmpMatrixCell: root('Data/MatrixCell').id,
    cmpMatrixCellLabel: child('Data/MatrixCell', 'Label'),
    cmpPageContainer: root('Layout/PageContainer').id,
    cmpPageContainerTitle: child('Layout/PageContainer', 'Title'),
    cmpActionFooter: root('Layout/ActionFooter').id,
    cmpActionFooterDivider: child('Layout/ActionFooter', 'Divider'),
    cmpDrawerDetail: root('Drawer/Detail').id,
    cmpDrawerDetailTitle: child('Drawer/Detail', 'Title'),
    cmpTableLayout: root('Data/TableLayout').id,
    cmpTableLayoutHeader: child('Data/TableLayout', 'Header Surface'),
    cmpCardStandard: root('Card/Standard').id,
    cmpCardStandardTitle: child('Card/Standard', 'Title'),
    cmpCardStandardContent: child('Card/Standard', 'Content'),
    cmpCardStandardMeta: child('Card/Standard', 'Meta'),
    cmpCardMetric: root('Card/Metric').id,
    cmpCardMetricLabel: child('Card/Metric', 'Label'),
    cmpCardMetricValue: child('Card/Metric', 'Value'),
    cmpCardMetricTrend: child('Card/Metric', 'Trend'),
    cmpModalStandard: root('Modal/Standard').id,
    cmpModalStandardTitle: child('Modal/Standard', 'Title'),
    cmpModalStandardContent: child('Modal/Standard', 'Content'),
    cmpModalStandardCancel: descendantPath('Modal/Standard', ['Cancel', 'Label']),
    cmpModalStandardConfirmButton: descendant('Modal/Standard', 'Confirm'),
    cmpModalStandardConfirm: descendantPath('Modal/Standard', ['Confirm', 'Label']),
    cmpNotificationInfo: root('Notification/Info').id,
    cmpNotificationInfoTitle: child('Notification/Info', 'Title'),
    cmpNotificationInfoContent: child('Notification/Info', 'Content'),
    cmpNotificationInfoClose: child('Notification/Info', 'Close'),
    cmpNotificationSuccess: root('Notification/Success').id,
    cmpNotificationSuccessTitle: child('Notification/Success', 'Title'),
    cmpNotificationSuccessContent: child('Notification/Success', 'Content'),
    cmpNotificationSuccessClose: child('Notification/Success', 'Close'),
    cmpNotificationWarning: root('Notification/Warning').id,
    cmpNotificationWarningTitle: child('Notification/Warning', 'Title'),
    cmpNotificationWarningContent: child('Notification/Warning', 'Content'),
    cmpNotificationWarningClose: child('Notification/Warning', 'Close'),
    cmpNotificationDanger: root('Notification/Danger').id,
    cmpNotificationDangerTitle: child('Notification/Danger', 'Title'),
    cmpNotificationDangerContent: child('Notification/Danger', 'Content'),
    cmpNotificationDangerClose: child('Notification/Danger', 'Close'),
  };
}

function expectedSheetHeight(pages) {
  const desktopCount = pages.filter((page) => !page.id.startsWith('M')).length;
  const mobileCount = pages.length - desktopCount;
  const desktopRows = Math.ceil(desktopCount / 4);
  const mobileRows = Math.ceil(mobileCount / 8);
  return mobileCount > 0
    ? 440 + desktopRows * 1020 + mobileRows * 964 - 60
    : desktopRows * 1020 + 380;
}

async function pngDimensions(path) {
  const buffer = await readFile(path);
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Invalid PNG file: ${path}`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function fileSha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

function validatePageSpecs() {
  const expected = new Map([
    ['cnas-01-workbench', [7, 2]], ['cnas-02-customer-commission', [9, 0]],
    ['cnas-03-sample-management', [12, 1]], ['cnas-04-testing-management', [14, 1]],
    ['cnas-05-report-management', [11, 1]], ['cnas-06-resource-management', [26, 1]],
    ['cnas-07-quality-management', [12, 0]], ['cnas-08-governance-management', [15, 0]],
    ['cnas-09-accreditation-management', [8, 0]], ['cnas-10-system-management', [16, 0]],
  ]);
  const requiredFields = ['id', 'title', 'role', 'kind', 'goal', 'fields', 'root', 'menu', 'pageType', 'entry', 'back', 'flow', 'requirement', 'flowIds', 'flowNode', 'primaryNext', 'returnTarget', 'alternatePaths', 'allowedActions'];
  const ids = new Set();
  const actionIds = new Set();
  const errors = [];
  if (domains.length !== 10) errors.push(`设计分卷 ${domains.length}/10`);
  for (const domain of domains) {
    const counts = [domain.pages.filter((page) => !page.hidden && !page.id.startsWith('M')).length, domain.pages.filter((page) => !page.hidden && page.id.startsWith('M')).length];
    const wanted = expected.get(domain.basename);
    if (!wanted || counts[0] !== wanted[0] || counts[1] !== wanted[1]) errors.push(`${domain.basename} 页面 ${counts.join('/')}/${wanted?.join('/') ?? '未定义'}`);
    for (const page of domain.pages) {
      const missing = requiredFields.filter((field) => page[field] === undefined || page[field] === '');
      if (missing.length) errors.push(`${page.id} 缺少 ${missing.join(',')}`);
      if (!Array.isArray(page.fields) || page.fields.length < 4) errors.push(`${page.id} fields 少于4项`);
      if (!['入口页', '操作页'].includes(page.pageType)) errors.push(`${page.id} pageType 无效`);
      const missingProfileSections = INTERACTION_PROFILE_SECTIONS.filter((section) => !page.interactionProfile?.[section]);
      if (page.interactionProfile?.version !== INTERACTION_PROFILE_VERSION || missingProfileSections.length) errors.push(`${page.id} interactionProfile 不完整`);
      if (ids.has(page.id)) errors.push(`重复页面ID ${page.id}`);
      ids.add(page.id);
      if (!Array.isArray(page.flowIds) || !page.flowIds.length) errors.push(`${page.id} 缺少 flowIds`);
      if (typeof page.flowNode !== 'string' || !page.flowNode) errors.push(`${page.id} 缺少 flowNode`);
      if (!Array.isArray(page.alternatePaths)) errors.push(`${page.id} alternatePaths 必须为数组`);
      if (!Array.isArray(page.allowedActions) || !page.allowedActions.length) errors.push(`${page.id} 缺少 allowedActions`);
      if (!Array.isArray(page.actionContracts) || !page.actionContracts.length) errors.push(`${page.id} 缺少 actionContracts`);
      for (const action of page.actionContracts ?? []) {
        const actionMissing = ['actionId', 'label', 'placement', 'surface', 'visibleWhen'].filter((field) => action[field] === undefined || action[field] === '');
        if (actionMissing.length) errors.push(`${page.id} 动作缺少 ${actionMissing.join(',')}`);
        if (actionIds.has(action.actionId)) errors.push(`重复动作ID ${action.actionId}`);
        actionIds.add(action.actionId);
        if (!['page', 'drawer', 'modal', 'inline'].includes(action.surface)) errors.push(`${action.actionId} surface 无效`);
        if (action.surface === 'page' && (!action.targetPageId || !action.returnTarget || !action.flowAnchorPageId)) errors.push(`${action.actionId} 页面动作契约不完整`);
        if (['drawer', 'modal'].includes(action.surface) && !action.variantFrameId) errors.push(`${action.actionId} 缺少 variantFrameId`);
        if (action.surface === 'inline' && !action.effect) errors.push(`${action.actionId} 缺少 effect`);
        if (action.controlState === 'disabled') {
          const missingDisabledFields = ['enabledWhen', 'disabledReason']
            .filter((field) => action[field] === undefined || action[field] === '');
          if (missingDisabledFields.length) errors.push(`${action.actionId} 禁用契约缺少 ${missingDisabledFields.join(',')}`);
        }
      }
      const localFlow = page.interactionProfile?.flow;
      if (!Array.isArray(localFlow?.steps) || !localFlow.steps.length) errors.push(`${page.id} 缺少局部交互步骤`);
      if (!Number.isInteger(localFlow?.currentStep) || localFlow.currentStep < 1 || localFlow.currentStep > (localFlow.steps?.length ?? 0)) {
        errors.push(`${page.id} 局部交互当前步骤无效`);
      }
      if (page.renderFamily && page.flowContexts?.[0]?.steps === localFlow?.steps) {
        errors.push(`${page.id} 局部交互步骤被主流程覆盖`);
      }
      const forbidden = forbiddenVisibleTerms.filter((term) => JSON.stringify(page).includes(term));
      if (forbidden.length) errors.push(`${page.id} 规格禁词 ${forbidden.join(',')}`);
    }
  }
  const basePages = domains.flatMap((domain) => domain.pages).filter((page) => !page.hidden);
  const desktop = basePages.filter((page) => !page.id.startsWith('M')).length;
  const mobile = basePages.length - desktop;
  if (desktop !== 130 || mobile !== 6) errors.push(`总页面 ${desktop}/${mobile}，期望130/6`);
  const system = domains.find((domain) => domain.root === '系统管理');
  const requiredSystemMenus = ['组织管理', '用户管理', '角色管理', '权限管理', '审计日志', '工作流配置', '编号规则', '模板管理', '消息配置', '数据字典', '接口监控'];
  const systemMenus = new Set(system?.pages.map((page) => page.menu));
  const missingSystemMenus = requiredSystemMenus.filter((menu) => !systemMenus.has(menu));
  if (missingSystemMenus.length) errors.push(`系统管理缺少 ${missingSystemMenus.join(',')}`);
  for (const domain of domains) {
    for (const page of domain.pages) {
      const routingTargets = [
        page.primaryNext,
        page.returnTarget,
        ...(page.alternatePaths ?? []).map((path) => path?.target),
      ].filter(Boolean);
      for (const target of routingTargets) {
        if (!pageById.has(target)) errors.push(`${page.id} 跳转目标不存在 ${target}`);
      }
      for (const action of page.actionContracts ?? []) {
        if (action.targetPageId && !pageById.has(action.targetPageId)) errors.push(`${action.actionId} 目标页面不存在 ${action.targetPageId}`);
        if (action.returnTarget && !pageById.has(action.returnTarget)) errors.push(`${action.actionId} 返回页面不存在 ${action.returnTarget}`);
        if (action.flowAnchorPageId && !pageById.has(action.flowAnchorPageId)) errors.push(`${action.actionId} 流程锚点不存在 ${action.flowAnchorPageId}`);
      }
      if (page.flowContext) {
        const nodeIndex = page.flowContext.nodeIndex ?? page.flowContext.currentStep;
        const nodeCount = page.flowContext.nodeCount ?? page.flowContext.stepCount ?? page.flowContext.steps?.length;
        if (!nodeIndex || !nodeCount || nodeIndex < 1 || nodeIndex > nodeCount) errors.push(`${page.id} 主流程步骤无效`);
        if (!['completed', 'current', 'pending', 'returned', 'blocked', 'terminal'].includes(page.flowContext.nodeState ?? 'current')) errors.push(`${page.id} nodeState 无效`);
      }
      for (const context of page.flowContexts ?? []) {
        if (!/^P(?:0[1-9]|1[0-2])$/.test(context.flowId ?? '')) continue;
        const missingContext = ['steps', 'nodeIndex', 'nodeState', 'normalNext', 'returnTarget', 'blockedTarget']
          .filter((field) => context[field] === undefined || context[field] === null || context[field] === '');
        if (missingContext.length) errors.push(`${page.id}/${context.flowId} 流程上下文缺少 ${missingContext.join(',')}`);
      }
    }
  }
  for (const flow of flowCatalog) {
    const owner = domains.find((domain) => domain.basename === flow.owner);
    if (!owner) errors.push(`${flow.id} 主属设计稿不存在 ${flow.owner}`);
    if (!flow.nodes.length || !flow.terminal) errors.push(`${flow.id} 流程节点或终态缺失`);
    for (const pageId of flow.nodes) {
      const page = pageById.get(pageId);
      if (!page) {
        errors.push(`${flow.id} 引用了不存在页面 ${pageId}`);
        continue;
      }
      if (!page.flowIds?.includes(flow.id)) errors.push(`${pageId} 未关联 ${flow.id}`);
      if (!page.flowNode) errors.push(`${pageId} 缺少 flowNode`);
    }
  }
  const p02 = flowCatalog.find((flow) => flow.id === 'P02');
  if (p02?.nodes.indexOf('SM06') !== 3 || p02?.nodes.indexOf('SM08') !== 5) errors.push('P02 关键节点位置必须为 SM06=4、SM08=6');
  const p07 = flowCatalog.find((flow) => flow.id === 'P07');
  const expectedP07 = ['GOV01', 'GOV02', 'GOV03', 'GOV04', 'GOV04-EXEC', 'GOV06', 'GOV08'];
  if (JSON.stringify(p07?.nodes) !== JSON.stringify(expectedP07)) errors.push('P07 链路不符合文件修订闭环');
  for (const [pageId, expectedBlockedTarget] of [['GOV04-EXEC', 'GOV04-EXEC'], ['GOV06', 'GOV06']]) {
    const page = pageById.get(pageId);
    const context = page?.flowContexts?.find((item) => item.flowId === 'P07');
    if (context?.blockedTarget !== expectedBlockedTarget) errors.push(`${pageId} 阻断目标必须停留当前节点`);
  }
  const archiveAction = pageById.get('GOV08')?.actionContracts?.find((action) => action.actionId === 'GOV08.完成归档');
  if (archiveAction?.controlState !== 'disabled'
    || archiveAction?.enabledWhen !== '签收执行完成 && 回收完成 && 完整性检查通过'
    || !archiveAction?.disabledReason) {
    errors.push('GOV08.完成归档 必须呈现签收、回收与完整性条件控制的禁用状态');
  }
  if (errors.length) throw new Error(`页面规格校验失败：\n- ${errors.join('\n- ')}`);
}

function previewLayout(items) {
  const scale = 0.5;
  const desktop = items.filter((item) => !item.isMobile);
  const mobile = items.filter((item) => item.isMobile);
  const desktopRows = Math.ceil(desktop.length / 4);
  const mobileRows = Math.ceil(mobile.length / 8);
  return {
    width: 3060,
    height: Math.max(1, desktopRows * 510 + mobileRows * 482),
    scale,
    position(item) {
      if (!item.isMobile) {
        const index = desktop.indexOf(item);
        return { left: (index % 4) * 780, top: Math.floor(index / 4) * 510 };
      }
      const index = mobile.indexOf(item);
      return { left: (index % 8) * 255, top: desktopRows * 510 + Math.floor(index / 8) * 482 };
    },
  };
}

function pageMapMarkdown() {
  const lines = [
    '# CNAS 实验室信息管理系统页面地图', '',
    '> 产品：CNAS 实验室信息管理系统  ',
    '> 业务口径：通用 ISO/IEC 17025 检测/校准实验室  ',
    '> 设计基线：Vben Admin 5.x `web-ele` + Element Plus', '',
    '## 导航规则', '',
    '- 侧栏采用“一级业务模块 → 二级功能入口”，不设置中间占位分组。',
    '- 一级菜单不对应空白页面；点击后进入当前账号有权访问的第一个二级功能。',
    '- 新增、编辑、详情、审核、签发、整改等操作页为隐藏路由，由按钮、行操作、待办或业务关联进入。',
    '- 顶栏仅保留搜索、通知和账号入口；适用角色记录在本页面地图中，不作为页面装饰标签。',
    '- 页面使用非生产虚构数据呈现有数据状态，不使用真实个人信息、证书号或未经核验的标准编号。', '',
    '## 设计文件与页面', '',
    '| 设计文件 | 一级菜单 | 桌面入口页 + 隐藏操作页 | 移动页 | 流程画板 + 状态画板 | 二级功能 |',
    '| --- | --- | ---: | ---: | ---: | --- |',
  ];
  const cell = (value) => String(value ?? '').replaceAll('|', '／').replaceAll('\n', ' ');
  for (const domain of domains) {
    const desktop = domain.pages.filter((page) => !page.hidden && !page.id.startsWith('M')).length;
    const mobile = domain.pages.filter((page) => !page.hidden && page.id.startsWith('M')).length;
    const hidden = domain.pages.filter((page) => page.hidden).length;
    const states = actionStateBoardsForDomain(domain).length;
    lines.push(`| \`${domain.basename}.pen/.png\` | ${domain.root} | ${desktop} + ${hidden} 隐藏操作页 | ${mobile} | ${flowBoardsForDomain(domain).length} + ${states} 状态画板 | ${[...new Set(domain.pages.filter((page) => !page.hidden).map((page) => page.menu))].join('、')} |`);
  }
  for (const domain of domains) {
    lines.push('', `## ${domain.root}`, '',
      '| 页面编号 | 二级菜单 | 页面名称 | 页面类型 | 进入方式 | 返回目标 | 适用角色 | 流程编号/节点 | 正常去向/退回 | 关键状态/字段 | 组件模式 | 需求来源 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const page of domain.pages) {
      const flowNode = page.flowIds?.length ? `${page.flowIds.join('、')} / ${page.flowNode}` : cell(page.flow);
      const routing = [page.primaryNext ? `下一页 ${page.primaryNext}` : '流程终点', page.returnTarget ? `退回 ${page.returnTarget}` : '无退回页'].join('；');
      lines.push(`| ${cell(page.id)} | ${cell(page.menu)} | ${cell(page.title)} | ${cell(page.pageType)} | ${cell(page.entry)} | ${cell(page.back)} | ${cell(page.role)} | ${cell(flowNode)} | ${cell(routing)} | ${cell(page.fields.join('、'))} | ${cell(page.kind)} | ${cell(page.requirement)} |`);
    }
    lines.push('', `### ${domain.root}操作映射`, '',
      '| 动作编号 | 来源页面 | 显示动作 | 位置 | 界面形态 | 目标页/状态画板/页内效果 | 返回页 | 流程锚点 | 显示条件 | 控制状态/启用条件 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const page of domain.pages) {
      for (const action of page.actionContracts ?? []) {
        const target = action.surface === 'page'
          ? action.targetPageId
          : ['drawer', 'modal'].includes(action.surface)
            ? `State/${action.variantFrameId}`
            : action.effect;
        const control = action.controlState === 'disabled'
          ? `禁用；${action.enabledWhen}；${action.disabledReason}`
          : '可用；满足显示条件后执行';
        lines.push(`| ${cell(action.actionId)} | ${cell(page.id)} | ${cell(action.label)} | ${cell(action.placement)} | ${cell(action.surface)} | ${cell(target)} | ${cell(action.returnTarget)} | ${cell(action.flowAnchorPageId)} | ${cell(action.visibleWhen)} | ${cell(control)} |`);
      }
    }
  }
  lines.push('', '## 核心流程覆盖', '',
    '| 流程 | 主属设计稿 | 节点页面 | 终态 |', '| --- | --- | --- | --- |');
  for (const flow of flowCatalog) {
    lines.push(`| ${flow.id} ${flow.title} | \`${flow.owner}.pen\` | ${flow.nodes.join(' → ')} | ${flow.terminal} |`);
  }
  lines.push('',
    '## 待确认', '',
    '- `[待确认]` 电子签名的准确触发点和审批层级。',
    '- `[待确认]` 记录、报告和审计日志的保存期限。',
    '- `[待确认]` 外部接口协议、消息渠道和失败补偿时限。', '');
  return lines.join('\n');
}

async function writePageMap() {
  await writeFile(join(DESIGN_DIR, 'cnas-page-map.md'), pageMapMarkdown(), 'utf8');
}

async function designUsesCurrentNavigation(file, domain) {
  if (!existsSync(file)) return false;
  const probe = join(DESIGN_DIR, `.navigation-${domain.basename}.pen`);
  let raw;
  try {
    raw = await runInteractive({
      input: file,
      output: probe,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_get', { patterns: [{ name: `^(${domain.pages.map((page) => page.id).join('|')})\\s` }], readDepth: 1 }),
        'save()',
        'exit()',
      ],
    });
  } finally {
    await rm(probe, { force: true });
  }
  const pages = extractJsonObjects(raw).flatMap((response) => response.nodes ?? []);
  const desktopSpecs = domain.pages.filter((page) => !page.id.startsWith('M') && page.kind !== 'login');
  return desktopSpecs.every((spec) => {
    const page = pages.find((node) => node.name?.startsWith(`${spec.id} `));
    const tab = page?.children?.find((node) => node.name === 'Tab');
    const expected = `${domain.root}  /  ${spec.menu}${spec.pageType === '操作页' ? `  /  ${spec.title}` : ''}`;
    return tab?.content === expected;
  });
}

async function artifactFingerprint() {
  const files = [
    ...domains.flatMap((domain) => [
      join(DESIGN_DIR, `${domain.basename}.pen`),
      join(DESIGN_DIR, `${domain.basename}.png`),
    ]),
    join(DESIGN_DIR, 'cnas-page-map.md'),
    join(DESIGN_DIR, 'cnas-validation-report.json'),
    join(ROOT, 'scripts', 'generate-cnas-pencil-designs.mjs'),
    join(ROOT, 'scripts', 'cnas-page-specs-business.mjs'),
    join(ROOT, 'scripts', 'cnas-page-specs-resources.mjs'),
    join(ROOT, 'scripts', 'cnas-page-specs-governance.mjs'),
  ].sort();
  const entries = [];
  for (const file of files) {
    if (!existsSync(file)) throw new Error(`Missing fingerprint artifact: ${file}`);
    entries.push({
      path: relative(ROOT, file).replaceAll('\\', '/'),
      sha256: await fileSha256(file),
    });
  }
  return {
    algorithm: 'sha256(JSON.stringify(sorted[{path,sha256}]))',
    files: entries,
    fingerprint: createHash('sha256').update(JSON.stringify(entries)).digest('hex'),
  };
}

async function validateDomain(domain, index, validationDir) {
  const source = join(DESIGN_DIR, `${domain.basename}.pen`);
  const preview = join(DESIGN_DIR, `${domain.basename}.png`);
  const probe = join(validationDir, `.validate-${index + 1}.pen`);
  const ids = domain.pages.map((page) => page.id);
  const flowBoards = flowBoardsForDomain(domain);
  const stateBoards = actionStateBoardsForDomain(domain);
  const pagePattern = `^(${ids.join('|')})\\s`;
  const flowBoardPattern = flowBoards.length ? `^(${flowBoards.map((flowBoard) => escapeRegex(flowBoard.name)).join('|')})$` : '^$';
  const stateBoardPattern = stateBoards.length ? `^(${stateBoards.map((stateBoard) => escapeRegex(stateBoard.name)).join('|')})$` : '^$';
  const expectedComponents = [
    'Button/Primary', 'Button/Secondary', 'Button/Danger', 'Button/Disabled', 'Form/Input',
    'Tag/Success', 'Tag/Warning', 'Tag/Danger', 'Tag/Info', 'Alert/Warning', 'Alert/Warning/Compact', 'Alert/Danger',
    'Table/Header', 'Table/Row', 'State/Skeleton', 'State/Empty', 'Form/Switch/On', 'Form/Switch/Off',
    'Navigation/RootItem', 'Navigation/SubmenuItem', 'Workflow/Step', 'Workflow/Stepper', 'Workflow/TimelineItem',
    'Form/FilterBar', 'Data/ListToolbar', 'Form/Checkbox/Checked', 'Form/Checkbox/Warning',
    'Form/Checkbox/Danger', 'Form/Checkbox/Empty', 'Data/MatrixCell',
    'Card/Standard', 'Card/Metric', 'Modal/Standard', 'Layout/PageContainer', 'Layout/ActionFooter', 'Drawer/Detail', 'Data/TableLayout',
    'Notification/Info', 'Notification/Success', 'Notification/Warning', 'Notification/Danger',
  ];
  const markerByKind = {
    receive: 'Sample Receive Scanner', record: 'Raw Record Grid',
    import: 'Import Reconciliation', report: 'Report Preview', audit: 'Internal Audit Plan',
    auditLog: 'Readonly Audit Log', qualityChart: 'Quality Control Chart', permission: 'Permission Matrix',
  };
  const markerByFamily = {
    approval: 'Approval Decision Workspace', workflow: 'Workflow Action Workspace',
    verification: 'Verification Workbench', lifecycle: 'Lifecycle Version Workspace',
  };
  const semanticMarkers = [...new Set(domain.pages.map((page) => {
    if (page.renderFamily) return markerByFamily[page.renderFamily];
    if (page.kind === 'schedule') {
      if (page.menu === '培训管理') return 'Training Calendar';
      if (page.menu === '设备管理') return 'Equipment Plan Calendar';
      return 'Resource Scheduling Board';
    }
    return markerByKind[page.kind];
  }).filter(Boolean))];
  if (!semanticMarkers.length) semanticMarkers.push('Page Title');
  semanticMarkers.push(...flowBoards.map((flowBoard) => flowBoard.name));
  if (!existsSync(source)) throw new Error(`Missing design file: ${source}`);
  if (!existsSync(preview)) throw new Error(`Missing preview file: ${preview}`);

  let raw;
  try {
    raw = await runInteractive({
      input: source,
      output: probe,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_get', { patterns: [{ name: pagePattern }], readDepth: 8 }),
        command('batch_get', { patterns: [{ name: pagePattern }], readDepth: 2 }),
        command('batch_get', { patterns: [
          { name: '^CNAS LIMS Design Contact Sheet$' },
          { name: '^00 Components & Tokens$' },
          { name: '^__Internal Reusable Components$' },
          { name: flowBoardPattern },
          { name: stateBoardPattern },
        ], readDepth: 8 }),
        command('batch_get', { patterns: [{ reusable: true }], readDepth: 0 }),
        command('batch_get', { patterns: semanticMarkers.map((name) => ({ name: `^${name}$` })), readDepth: 0 }),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 20 }),
        'save()',
        'exit()',
      ],
    });
  } finally {
    await rm(probe, { force: true });
  }

  const responses = extractJsonObjects(raw);
  if (responses.length < 6) {
    throw new Error(`Expected six Pencil JSON responses for ${domain.basename}, received ${responses.length}`);
  }
  const [pageResponse, pageSummaryResponse, boardResponse, componentResponse, semanticResponse, layoutResponse] = responses.slice(-6);
  const pageNodes = pageResponse.nodes ?? [];
  const pageSummaryNodes = pageSummaryResponse.nodes ?? [];
  const boardNodes = boardResponse.nodes ?? [];
  const contactSheet = boardNodes.find((node) => node.name === 'CNAS LIMS Design Contact Sheet');
  const legacyComponentSheet = boardNodes.find((node) => node.name === '00 Components & Tokens');
  const internalComponentSheets = boardNodes.filter((node) => node.name === '__Internal Reusable Components');
  const internalComponentSheetProblems = internalComponentSheets.length === 1
    && internalComponentSheets[0].opacity === 0
    && internalComponentSheets[0].x <= -1000
    && internalComponentSheets[0].y <= -1000
    ? []
    : [`内部组件画板数量/隐藏位置异常 ${internalComponentSheets.length}/1`];
  const topLevelDesignBlockProblems = [
    ...(contactSheet ? ['存在 CNAS LIMS Design Contact Sheet'] : []),
    ...(legacyComponentSheet ? ['存在可见 00 Components & Tokens'] : []),
    ...internalComponentSheetProblems,
  ];
  const renderedFlowBoards = flowBoards.filter((flowBoard) => boardNodes.some((node) => node.name === flowBoard.name));
  const renderedStateBoards = stateBoards.filter((stateBoard) => boardNodes.some((node) => node.name === stateBoard.name));
  const contactSheetChildNames = (contactSheet?.children ?? []).map((node) => node.name);
  const nestedPageNames = contactSheetChildNames.filter((name) => ids.some((id) => name?.startsWith(`${id} `)));
  const componentNodes = componentResponse.nodes ?? [];
  const pageDescendants = [];
  const collectDescendants = (node) => {
    pageDescendants.push(node);
    for (const child of node.children ?? []) collectDescendants(child);
  };
  for (const pageNode of pageNodes) collectDescendants(pageNode);
  const boardDescendants = [];
  const collectBoard = (node) => { boardDescendants.push(node); for (const child of node.children ?? []) collectBoard(child); };
  for (const board of boardNodes.filter((node) => renderedStateBoards.some((stateBoard) => stateBoard.name === node.name)
    || renderedFlowBoards.some((flowBoard) => flowBoard.name === node.name))) collectBoard(board);
  const inspectableDescendants = [...pageDescendants, ...boardDescendants];
  const refNodes = inspectableDescendants.filter((node) => node.type === 'ref');
  const textNodes = inspectableDescendants.filter((node) => node.type === 'text');
  const descendantsOf = (root) => {
    const descendants = [];
    const collect = (node) => {
      descendants.push(node);
      for (const child of node.children ?? []) collect(child);
    };
    collect(root);
    return descendants;
  };
  const expectedSourceActionName = (action) => `Action/${action.actionId} -> ${action.targetPageId || action.variantFrameId || action.effect || 'local-ui'}${action.controlState === 'disabled' ? ' [disabled]' : ''}`;
  const expectedStateActionName = (action) => `Action/${action.actionId} -> ${action.targetPageId || action.returnTarget || action.variantFrameId}${action.controlState === 'disabled' ? ' [disabled]' : ''}`;
  const sourceActionContractProblems = domain.pages.flatMap((page) => {
    const pageNode = pageNodes.find((node) => node.name?.startsWith(`${page.id} `));
    if (!pageNode) return (page.actionContracts ?? []).map((action) => `${action.actionId}:来源页面缺失`);
    const actionNames = descendantsOf(pageNode).map((node) => String(node.name ?? '')).filter((name) => name.startsWith('Action/'));
    return (page.actionContracts ?? []).flatMap((action) => {
      const expectedName = expectedSourceActionName(action);
      const sameAction = actionNames.filter((name) => name.startsWith(`Action/${action.actionId} -> `));
      if (!sameAction.includes(expectedName)) return [`${action.actionId}:来源页缺少 ${expectedName}`];
      const wrongNames = sameAction.filter((name) => name !== expectedName);
      return wrongNames.map((name) => `${action.actionId}:来源页目标或状态错误 ${name}`);
    });
  });
  const stateBoardActionProblems = stateBoards.flatMap((stateBoard) => {
    const board = boardNodes.find((node) => node.name === stateBoard.name);
    if (!board) return [`${stateBoard.action.actionId}:状态画板缺失`];
    const actionNames = descendantsOf(board).map((node) => String(node.name ?? '')).filter((name) => name.startsWith('Action/'));
    const expectedName = expectedStateActionName(stateBoard.action);
    const sameAction = actionNames.filter((name) => name.startsWith(`Action/${stateBoard.action.actionId} -> `));
    if (!sameAction.includes(expectedName)) return [`${stateBoard.action.actionId}:状态画板缺少 ${expectedName}`];
    return sameAction.filter((name) => name !== expectedName)
      .map((name) => `${stateBoard.action.actionId}:状态画板目标或状态错误 ${name}`);
  });
  const workflowStepSemanticProblems = pageNodes.flatMap((pageNode) => {
    const id = pageNode.name?.split(' ')[0];
    const spec = domain.pages.find((page) => page.id === id);
    if (!spec?.renderFamily || id?.startsWith('M')) return [];
    const descendants = descendantsOf(pageNode);
    const globalCount = descendants.filter((node) => node.name === 'Global Workflow Stepper').length;
    const localCount = descendants.filter((node) => node.name === 'Local Interaction Stepper').length;
    const problems = [];
    if (globalCount !== 1 || localCount !== 1) {
      problems.push(`${id}:主流程步骤器 ${globalCount}/1，局部步骤器 ${localCount}/1`);
      return problems;
    }
    const primaryContext = spec.flowContext
      || spec.flowContexts?.find((context) => context.flowId === spec.primaryFlowId)
      || spec.flowContexts?.[0];
    const localFlow = spec.interactionProfile?.flow;
    const scopes = [
      { name: '主流程', prefix: 'Global Workflow Step/', labels: primaryContext?.steps ?? [], current: primaryContext?.nodeIndex ?? 1, state: primaryContext?.nodeState ?? 'current' },
      { name: '局部流程', prefix: 'Local Interaction Step/', labels: localFlow?.steps ?? [], current: localFlow?.currentStep ?? 1, state: localFlow?.nodeState ?? 'current' },
    ];
    if (JSON.stringify(scopes[0].labels) === JSON.stringify(scopes[1].labels)) {
      problems.push(`${id}:主流程与局部流程标签序列相同`);
    }
    for (const scope of scopes) {
      const steps = descendants.filter((node) => String(node.name ?? '').startsWith(scope.prefix));
      if (steps.length !== scope.labels.length) {
        problems.push(`${id}:${scope.name}步骤数量 ${steps.length}/${scope.labels.length}`);
        continue;
      }
      for (const [index, label] of scope.labels.entries()) {
        const step = steps.find((node) => node.name === `${scope.prefix}${index + 1}`);
        if (!step) {
          problems.push(`${id}:${scope.name}缺少第 ${index + 1} 步`);
          continue;
        }
        const payload = [...descendantsOf(step), ...Object.values(step.descendants ?? {})];
        const labelNode = payload.find((node) => node.content === label);
        if (!labelNode) problems.push(`${id}:${scope.name}第 ${index + 1} 步标签不是 ${label}`);
        const shouldBeActive = index + 1 === scope.current;
        if (shouldBeActive && labelNode?.fontWeight !== '600') problems.push(`${id}:${scope.name}当前节点 ${scope.current} 未激活`);
        if (!shouldBeActive && labelNode?.fontWeight === '600') problems.push(`${id}:${scope.name}错误激活第 ${index + 1} 步`);
        if (shouldBeActive) {
          const expectedFill = scope.state === 'blocked' ? '$semantic-danger'
            : scope.state === 'returned' ? '$semantic-warning' : '$brand-primary';
          const marker = payload.find((node) => node.y === 0 && node.fill !== undefined);
          if (marker?.fill !== expectedFill) problems.push(`${id}:${scope.name}当前节点状态色 ${marker?.fill ?? '缺失'}/${expectedFill}`);
        }
      }
    }
    return problems;
  });
  const utilityActionNodes = inspectableDescendants.filter((node) => String(node.name ?? '').startsWith('Utility Action/'));
  const manualCheckboxNodes = inspectableDescendants.filter((node) => node.type === 'rectangle'
    && /^(Approval Check|Workflow Check|Receive Check|Permission Check|Check|Checklist)$/.test(String(node.name ?? '')));
  const manualCheckboxTextNodes = textNodes.filter((node) => /^\s*(?:□|☐|☑|✓)\s+/.test(String(node.content ?? '')));
  const truncatedStepLabels = textNodes.filter((node) => String(node.content ?? '').includes('…'));
  const specializedFooterProblems = pageNodes.flatMap((pageNode) => {
    const id = pageNode.name?.split(' ')[0];
    const spec = domain.pages.find((page) => page.id === id);
    if (!spec?.renderFamily || ['workflow', 'config'].includes(spec.kind)) return [];
    const descendants = [];
    const collect = (node) => { descendants.push(node); for (const child of node.children ?? []) collect(child); };
    collect(pageNode);
    return descendants.some((node) => node.name === 'Action Footer') ? [] : [`${id}:缺少独立操作区`];
  });
  const forbiddenFindings = textNodes.flatMap((node) => forbiddenVisibleTerms
    .filter((term) => String(node.content ?? '').includes(term))
    .map((term) => `${node.name}:${term}`));
  const reusableById = new Map(componentNodes.map((node) => [node.id, node]));
  const labelForButton = (node) => {
    const direct = (node.children ?? []).find((child) => child.name === 'Label')
      ?? Object.values(node.descendants ?? {}).find((descendant) => descendant.content !== undefined);
    if (direct) return direct;
    const component = reusableById.get(node.ref);
    return (component?.children ?? []).find((child) => child.name === 'Label')
      ?? Object.values(component?.descendants ?? {}).find((descendant) => descendant.content !== undefined);
  };
  const buttonNodes = refNodes.filter((node) => /^(?:Action|Utility Action)\//.test(String(node.name ?? '')));
  const buttonAlignmentProblems = buttonNodes.flatMap((node) => {
    const label = labelForButton(node);
    if (!label) return [`${node.name}:缺少标签节点`];
    const centered = (label.x === 0 && label.width === node.width && label.textAlign === 'center' && label.y >= 6 && label.y <= 9)
      || (label.x === 0 && label.width === 'fill_container' && label.y === 0 && label.textAlign === 'center'
        && label.textAlignVertical === 'middle');
    return centered ? [] : [`${node.name}:标签(${label.x},${label.y},${label.width})/按钮(${node.width})`];
  });
  const disabledButtons = inspectableDescendants.filter((node) => node.name?.startsWith('Disabled Button/'));
  const disabledAlignmentProblems = disabledButtons.flatMap((node) => {
    const label = (node.children ?? []).find((child) => child.name === 'Label');
    if (!label) return [`${node.name}:缺少标签节点`];
    return label.x === 0 && label.width === node.width && label.textAlign === 'center'
      ? [] : [`${node.name}:禁用标签未居中`];
  });
  const semanticNodes = semanticResponse.nodes ?? [];
  const layoutProblems = Array.isArray(layoutResponse.nodes)
    ? layoutResponse.nodes
    : layoutResponse.nodes === 'No layout problems.' ? [] : [layoutResponse.nodes ?? 'Unknown layout response'];
  const actualIds = pageNodes.map((node) => node.name?.split(' ')[0]).filter(Boolean);
  const missingIds = ids.filter((id) => !actualIds.includes(id));
  const unexpectedIds = actualIds.filter((id) => !ids.includes(id));
  const invalidSizes = pageNodes.filter((node) => {
    const mobile = node.name?.startsWith('M');
    return node.width !== (mobile ? 390 : 1440) || node.height !== (mobile ? 844 : 900);
  });
  const componentNames = componentNodes.map((node) => node.name);
  const componentIds = componentNodes.map((node) => node.id);
  const componentIdByName = new Map(componentNodes.map((node) => [node.name, node.id]));
  const collectNested = (node, output) => {
    output.push(node);
    for (const child of node.children ?? []) collectNested(child, output);
  };
  const stateSurfaceProblems = renderedStateBoards.flatMap((stateBoard) => {
    const board = boardNodes.find((node) => node.name === stateBoard.name);
    const descendants = [];
    if (board) collectNested(board, descendants);
    const expectedRef = stateBoard.action.surface === 'modal' ? componentIdByName.get('Modal/Standard') : componentIdByName.get('Drawer/Detail');
    return descendants.some((node) => node.type === 'ref' && node.ref === expectedRef) ? [] : [`${stateBoard.name}:缺少${stateBoard.action.surface}组件`];
  });
  const disabledActionSemanticProblems = domain.pages.flatMap((page) => (page.actionContracts ?? [])
    .filter((action) => action.controlState === 'disabled')
    .flatMap((action) => {
      const stateBoard = stateBoards.find((candidate) => candidate.action.actionId === action.actionId);
      const board = stateBoard && boardNodes.find((node) => node.name === stateBoard.name);
      if (!board) return [`${action.actionId}:缺少禁用状态画板`];
      const descendants = descendantsOf(board);
      const content = descendants.map((node) => String(node.content ?? '')).join('\n');
      const problems = [];
      if (!descendants.some((node) => node.type === 'ref' && node.ref === componentIdByName.get('Button/Disabled'))) {
        problems.push(`${action.actionId}:状态画板未引用 Button/Disabled`);
      }
      if (!content.includes(action.enabledWhen)) problems.push(`${action.actionId}:状态画板缺少启用条件`);
      if (!content.includes(action.disabledReason)) problems.push(`${action.actionId}:状态画板缺少禁用原因`);
      return problems;
    }));
  const tableComponentProblems = pageNodes.flatMap((pageNode) => {
    const descendants = [];
    const collect = (node) => { descendants.push(node); for (const child of node.children ?? []) collect(child); };
    collect(pageNode);
    const tableShells = descendants.filter((node) => ['VxeTable', 'Compact Business Table'].includes(node.name));
    if (!tableShells.length) return [];
    const refs = new Set(descendants.filter((node) => node.type === 'ref').map((node) => node.ref));
    return refs.has(componentIdByName.get('Table/Header')) && refs.has(componentIdByName.get('Table/Row'))
      ? [] : [`${pageNode.name}:表格未引用 Table/Header 与 Table/Row`];
  });
  const missingComponents = expectedComponents.filter((name) => !componentNames.includes(name));
  const usedComponentIds = [...new Set(refNodes.map((node) => node.ref).filter((ref) => componentIds.includes(ref)))];
  const usedComponentNames = componentNodes.filter((node) => usedComponentIds.includes(node.id)).map((node) => node.name);
  const missingInstantiatedComponents = expectedComponents.filter((name) => !usedComponentNames.includes(name));
  const semanticNames = semanticNodes.map((node) => node.name);
  const missingSemanticMarkers = semanticMarkers.filter((name) => !semanticNames.includes(name));
  const previewSize = await pngDimensions(preview);
  const expectedPreviewSize = previewLayout(contactSheetPages(domain.pages, false, flowBoards, stateBoards));
  const artifactHashes = { sourceSha256: await fileSha256(source), previewSha256: await fileSha256(preview) };
  const errors = [];
  const navigationProblems = pageSummaryNodes.flatMap((pageNode) => {
    const id = pageNode.name?.split(' ')[0];
    const spec = domain.pages.find((page) => page.id === id);
    if (!spec || spec.kind === 'login' || id?.startsWith('M')) return [];
    const descendants = [];
    const collect = (node) => { descendants.push(node); for (const child of node.children ?? []) collect(child); };
    collect(pageNode);
    const tab = descendants.find((node) => node.name === 'Tab');
    const pageTitle = descendants.find((node) => node.name === 'Page Title');
    const expectedTab = `${domain.root}  /  ${spec.menu}${spec.pageType === '操作页' ? `  /  ${spec.title}` : ''}`;
    const consistent = descendants.some((node) => node.name === 'Sidebar')
      && descendants.some((node) => node.type === 'ref' && node.ref === componentIdByName.get('Navigation/RootItem'))
      && descendants.some((node) => node.type === 'ref' && node.ref === componentIdByName.get('Navigation/SubmenuItem'))
      && tab?.content === expectedTab
      && pageTitle?.content === spec.title;
    return consistent ? [] : [`${id}:${domain.root}/${spec.menu}/${spec.title}`];
  });
  if (pageNodes.length !== domain.pages.length) errors.push(`页面数量 ${pageNodes.length}/${domain.pages.length}`);
  if (missingIds.length) errors.push(`缺少页面 ${missingIds.join(', ')}`);
  if (unexpectedIds.length) errors.push(`意外页面 ${unexpectedIds.join(', ')}`);
  if (nestedPageNames.length) errors.push(`业务页面仍嵌套在联系表 ${nestedPageNames.join(', ')}`);
  if (topLevelDesignBlockProblems.length) errors.push(`模块顶部设计块异常 ${topLevelDesignBlockProblems.join(', ')}`);
  if (invalidSizes.length) errors.push(`尺寸错误 ${invalidSizes.map((node) => node.name).join(', ')}`);
  if (renderedFlowBoards.length !== flowBoards.length) errors.push(`流程画板缺失 ${renderedFlowBoards.length}/${flowBoards.length}`);
  if (renderedStateBoards.length !== stateBoards.length) errors.push(`动作状态画板缺失 ${renderedStateBoards.length}/${stateBoards.length}`);
  if (stateSurfaceProblems.length) errors.push(`动作状态画板组件异常 ${stateSurfaceProblems.slice(0, 8).join(', ')}`);
  if (sourceActionContractProblems.length) errors.push(`来源页动作契约异常 ${sourceActionContractProblems.slice(0, 12).join(', ')}`);
  if (stateBoardActionProblems.length) errors.push(`状态画板动作契约异常 ${stateBoardActionProblems.slice(0, 12).join(', ')}`);
  if (disabledActionSemanticProblems.length) errors.push(`禁用动作语义异常 ${disabledActionSemanticProblems.slice(0, 8).join(', ')}`);
  if (workflowStepSemanticProblems.length) errors.push(`流程步骤语义异常 ${workflowStepSemanticProblems.slice(0, 8).join(', ')}`);
  if (utilityActionNodes.length) errors.push(`存在未映射操作 ${utilityActionNodes.slice(0, 8).map((node) => node.name).join(', ')}`);
  if (componentNodes.length !== expectedComponents.length) errors.push(`可复用组件数量 ${componentNodes.length}/${expectedComponents.length}`);
  if (missingComponents.length) errors.push(`缺少组件 ${missingComponents.join(', ')}`);
  if (refNodes.length < domain.pages.length) errors.push(`组件实例数量 ${refNodes.length}/${domain.pages.length}，页面复用不足`);
  if (usedComponentIds.length < 7) errors.push(`业务页面组件类型不足 ${usedComponentIds.length}/13`);
  if (missingSemanticMarkers.length) errors.push(`缺少业务语义节点 ${missingSemanticMarkers.join(', ')}`);
  if (navigationProblems.length) errors.push(`导航路径不一致 ${navigationProblems.slice(0, 8).join(', ')}`);
  if (forbiddenFindings.length) errors.push(`可见禁词 ${forbiddenFindings.slice(0, 8).join(', ')}`);
  if (buttonAlignmentProblems.length) errors.push(`按钮文字未居中 ${buttonAlignmentProblems.slice(0, 8).join(', ')}`);
  if (disabledAlignmentProblems.length) errors.push(`禁用按钮文字未居中 ${disabledAlignmentProblems.slice(0, 8).join(', ')}`);
  if (manualCheckboxNodes.length) errors.push(`存在手绘复选框 ${manualCheckboxNodes.slice(0, 8).map((node) => node.name).join(', ')}`);
  if (manualCheckboxTextNodes.length) errors.push(`存在文本复选框 ${manualCheckboxTextNodes.slice(0, 8).map((node) => node.content).join(', ')}`);
  if (tableComponentProblems.length) errors.push(`表格组件缺失 ${tableComponentProblems.slice(0, 8).join(', ')}`);
  if (truncatedStepLabels.length) errors.push(`步骤文字被省略 ${truncatedStepLabels.slice(0, 8).map((node) => node.content).join(', ')}`);
  if (specializedFooterProblems.length) errors.push(`专项页面操作区异常 ${specializedFooterProblems.slice(0, 8).join(', ')}`);
  if (layoutProblems.length) errors.push(`布局问题节点 ${layoutProblems.length}`);
  if (previewSize.width !== expectedPreviewSize.width || previewSize.height !== expectedPreviewSize.height) {
    errors.push(`预览尺寸 ${previewSize.width}x${previewSize.height}/${expectedPreviewSize.width}x${expectedPreviewSize.height}`);
  }
  return {
    design: domain.basename,
    pages: pageNodes.length,
    desktopPages: pageNodes.filter((node) => !node.name?.startsWith('M')).length,
    mobilePages: pageNodes.filter((node) => node.name?.startsWith('M')).length,
    reusableComponents: componentNodes.length,
    componentInstances: refNodes.length,
    instantiatedComponentTypes: usedComponentIds.length,
    missingInstantiatedComponents,
    semanticMarkers: semanticNodes.length,
    forbiddenVisibleTerms: forbiddenFindings.length,
    buttonAlignmentProblems: buttonAlignmentProblems.length + disabledAlignmentProblems.length,
    topLevelDesignBlockProblems: topLevelDesignBlockProblems.length,
    sourceActionContractProblems: sourceActionContractProblems.length,
    stateBoardActionProblems: stateBoardActionProblems.length,
    stateSurfaceProblems: stateSurfaceProblems.length,
    disabledActionSemanticProblems: disabledActionSemanticProblems.length,
    workflowStepSemanticProblems: workflowStepSemanticProblems.length,
    utilityActions: utilityActionNodes.length,
    componentAudit: {
      manualCheckboxNodes: manualCheckboxNodes.length,
      manualCheckboxTextNodes: manualCheckboxTextNodes.length,
      truncatedStepLabels: truncatedStepLabels.length,
      specializedFooterProblems: specializedFooterProblems.length,
      tableComponentProblems: tableComponentProblems.length,
    },
    navigationProblems: navigationProblems.length,
    layoutProblems: layoutProblems.length,
    layoutProblemNodes: layoutProblems.slice(0, 5),
    topLevelPageProblems: nestedPageNames,
    previewSize,
    expectedPreviewSize,
    artifactHashes,
    status: errors.length ? 'failed' : 'passed',
    errors,
  };
}

async function validateDesignSystem(index, validationDir) {
  const basename = 'cnas-design-system';
  const source = join(DESIGN_DIR, `${basename}.pen`);
  const preview = join(DESIGN_DIR, `${basename}.png`);
  const probe = join(validationDir, `.validate-${index + 1}.pen`);
  const expectedSections = [
    'Section/01 设计令牌', 'Section/02 导航', 'Section/03 操作与反馈',
    'Section/04 表单', 'Section/05 数据展示', 'Section/06 流程与审批',
    'Section/07 卡片、弹窗与通知',
  ];
  const expectedComponents = [
    'Button/Primary', 'Button/Secondary', 'Button/Danger', 'Button/Disabled', 'Form/Input',
    'Tag/Success', 'Tag/Warning', 'Tag/Danger', 'Tag/Info', 'Alert/Warning', 'Alert/Warning/Compact', 'Alert/Danger',
    'Table/Header', 'Table/Row', 'State/Skeleton', 'State/Empty', 'Form/Switch/On', 'Form/Switch/Off',
    'Navigation/RootItem', 'Navigation/SubmenuItem', 'Workflow/Step', 'Workflow/Stepper', 'Workflow/TimelineItem',
    'Form/FilterBar', 'Data/ListToolbar', 'Form/Checkbox/Checked', 'Form/Checkbox/Warning',
    'Form/Checkbox/Danger', 'Form/Checkbox/Empty', 'Data/MatrixCell',
    'Card/Standard', 'Card/Metric', 'Modal/Standard', 'Layout/PageContainer', 'Layout/ActionFooter', 'Drawer/Detail', 'Data/TableLayout',
    'Notification/Info', 'Notification/Success', 'Notification/Warning', 'Notification/Danger',
  ];
  const expectedSemanticMarkers = [
    'Navigation/Sidebar', 'Navigation/Topbar', 'Navigation/Breadcrumb', 'Navigation/Tabs',
    'Navigation/Tree', 'Alert/Warning', 'Result/AccessDenied', 'Modal/Confirm',
    'Upload/Dropzone', 'Form/Switches', 'Form/Validation', 'VbenForm/FilterBar',
    'VxeTable', 'Data/States', 'Timeline/Audit', 'Approval/Opinion',
    'Drawer/Detail', 'Page/Container', 'Card/Standard Preview', 'Card/Metric Preview',
    'Modal/Standard Preview', 'Notification/Info Preview', 'Notification/Success Preview',
    'Notification/Warning Preview', 'Notification/Danger Preview',
  ];
  const requiredPreviewInstances = [
    ['Button/Primary', 'Button/主要操作'], ['Button/Secondary', 'Button/次要操作'],
    ['Button/Danger', 'Button/危险操作'], ['Button/Disabled', 'Button/禁用操作'],
    ['Form/Input', 'Form/文本输入'], ['Tag/Success', 'Tag/通过'], ['Tag/Warning', 'Tag/待处理'],
    ['Tag/Danger', 'Tag/已阻断'], ['Tag/Info', 'Tag/草稿'], ['Alert/Warning', 'Alert/Warning'],
    ['Table/Header', 'Table Header Instance'], ['Table/Row', 'Table Row Instance 1'],
    ['State/Skeleton', 'State/Skeleton Preview'], ['State/Empty', 'State/Empty Preview'],
    ['Form/Switch/On', 'Switch/启用到期提醒'], ['Form/Switch/Off', 'Switch/锁定归档记录'],
  ];
  if (!existsSync(source)) throw new Error(`Missing design file: ${source}`);
  if (!existsSync(preview)) throw new Error(`Missing preview file: ${preview}`);

  let raw;
  try {
    raw = await runInteractive({
      input: source,
      output: probe,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_get', { patterns: [{ name: '^CNAS LIMS Design Contact Sheet$' }], readDepth: 1 }),
        command('batch_get', { patterns: expectedSections.map((name) => ({ name: `^${name}$` })), readDepth: 1 }),
        command('batch_get', { patterns: [{ reusable: true }], readDepth: 0 }),
        command('batch_get', { patterns: expectedSemanticMarkers.map((name) => ({ name: `^${name}$` })), readDepth: 0 }),
        command('batch_get', { patterns: requiredPreviewInstances.map(([, nodeName]) => ({ name: `^${nodeName}$` })), readDepth: 0 }),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 20 }),
        'save()',
        'exit()',
      ],
    });
  } finally {
    await rm(probe, { force: true });
  }

  const responses = extractJsonObjects(raw);
  if (responses.length < 6) {
    throw new Error(`Expected six Pencil JSON responses for ${basename}, received ${responses.length}`);
  }
  const [sheetResponse, sectionResponse, componentResponse, semanticResponse, instanceResponse, layoutResponse] = responses.slice(-6);
  const sheetNodes = sheetResponse.nodes ?? [];
  const sectionNodes = sectionResponse.nodes ?? [];
  const componentNodes = componentResponse.nodes ?? [];
  const semanticNodes = semanticResponse.nodes ?? [];
  const layoutProblems = Array.isArray(layoutResponse.nodes)
    ? layoutResponse.nodes
    : layoutResponse.nodes === 'No layout problems.' ? [] : [layoutResponse.nodes ?? 'Unknown layout response'];
  const sectionNames = sectionNodes.map((node) => node.name);
  const componentNames = componentNodes.map((node) => node.name);
  const semanticNames = semanticNodes.map((node) => node.name);
  const componentIdByName = new Map(componentNodes.map((node) => [node.name, node.id]));
  const previewNodes = instanceResponse.nodes ?? [];
  const missingPreviewComponentInstances = requiredPreviewInstances
    .filter(([componentName, nodeName]) => !previewNodes.some((node) => node.name === nodeName
      && node.type === 'ref' && node.ref === componentIdByName.get(componentName)))
    .map(([componentName]) => componentName);
  const missingSections = expectedSections.filter((name) => !sectionNames.includes(name));
  const missingComponents = expectedComponents.filter((name) => !componentNames.includes(name));
  const missingSemanticMarkers = expectedSemanticMarkers.filter((name) => !semanticNames.includes(name));
  const sheet = sheetNodes[0];
  const previewSize = await pngDimensions(preview);
  const expectedPreviewRatio = 3000 / 2380;
  const previewRatio = previewSize.width / previewSize.height;
  const artifactHashes = { sourceSha256: await fileSha256(source), previewSha256: await fileSha256(preview) };
  const errors = [];
  if (sheetNodes.length !== 1 || sheet?.width !== 3000 || sheet?.height !== 2380) errors.push('设计系统画板尺寸或数量不正确');
  if (missingSections.length) errors.push(`缺少分区 ${missingSections.join(', ')}`);
  if (missingComponents.length) errors.push(`缺少可复用组件 ${missingComponents.join(', ')}`);
  if (missingPreviewComponentInstances.length) errors.push(`联系表未引用关键组件 ${missingPreviewComponentInstances.join(', ')}`);
  if (missingSemanticMarkers.length) errors.push(`缺少组件语义 ${missingSemanticMarkers.join(', ')}`);
  if (layoutProblems.length) errors.push(`布局问题节点 ${layoutProblems.length}`);
  if (previewSize.width < 400 || previewSize.height < 300 || Math.abs(previewRatio - expectedPreviewRatio) > 0.01) {
    errors.push(`预览尺寸或比例异常 ${previewSize.width}x${previewSize.height}`);
  }
  return {
    design: basename,
    pages: 0,
    sections: sectionNodes.length,
    reusableComponents: componentNodes.length,
    semanticMarkers: semanticNodes.length,
    layoutProblems: layoutProblems.length,
    layoutProblemNodes: layoutProblems.slice(0, 5),
    previewSize,
    expectedSheetSize: { width: 3000, height: 2380 },
    artifactHashes,
    status: errors.length ? 'failed' : 'passed',
    errors,
  };
}

if (process.argv.includes('--check-generated')) {
  validatePageSpecs();
  new Function(templateOperations());
  for (const domain of domains) {
    const operations = pageOperations(domain.pages, {}, generationOptionsForDomain(domain));
    try {
      new Function(operations);
    } catch (error) {
      process.stderr.write(`${domain.basename}: ${error.message}\n`);
      process.stderr.write(operations.split('\n').map((line, index) => `${String(index + 1).padStart(3, ' ')} ${line}`).join('\n'));
      throw error;
    }
  }
  process.stdout.write('Generated Pencil operations are valid JavaScript.\n');
  process.exit(0);
}

if (process.argv.includes('--write-page-map')) {
  validatePageSpecs();
  await writePageMap();
  process.stdout.write('Wrote CNAS page map with flow routing.\n');
  process.exit(0);
}

if (process.argv.includes('--fingerprint')) {
  process.stdout.write(`${JSON.stringify(await artifactFingerprint(), null, 2)}\n`);
  process.exit(0);
}

if (process.argv.includes('--validate-existing')) {
  validatePageSpecs();
  const validationDir = await mkdtemp(join(tmpdir(), 'cnas-pencil-validate-'));
  const report = {
    cli: '@pen.dev/cli@0.3.0',
    results: [],
  };
  try {
    for (const [index, domain] of domains.entries()) {
      try {
        report.results.push(await validateDomain(domain, index, validationDir));
      } catch (error) {
        report.results.push({ design: domain.basename, status: 'failed', errors: [error.message] });
      }
    }
    try {
      report.results.push(await validateDesignSystem(domains.length, validationDir));
    } catch (error) {
      report.results.push({ design: 'cnas-design-system', status: 'failed', errors: [error.message] });
    }
  } finally {
    await rm(validationDir, { recursive: true, force: true });
  }
  report.summary = {
    designs: report.results.length,
    businessDesigns: domains.length,
    designSystems: 1,
    pages: report.results.reduce((sum, result) => sum + (result.pages ?? 0), 0),
    passed: report.results.filter((result) => result.status === 'passed').length,
    failed: report.results.filter((result) => result.status === 'failed').length,
  };
  if (process.argv.includes('--write-validation-report')) {
    const reportPath = join(DESIGN_DIR, 'cnas-validation-report.json');
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.summary.failed) process.exit(1);
  process.exit(0);
}

function screenshotBuffer(raw) {
  const images = screenshotBuffers(raw);
  if (!images.length) throw new Error('Pencil screenshot did not return PNG data');
  return images.at(-1);
}

function screenshotBuffers(raw) {
  const clean = raw.replace(ANSI_RE, '');
  const dataMatches = [...clean.matchAll(/"data"\s*:\s*"([^"]+)"/g)];
  const encodedImages = dataMatches.length
    ? dataMatches.map((match) => match[1])
    : [...clean.matchAll(/iVBORw0KGgo[A-Za-z0-9+/=\r\n]+/g)].map((match) => match[0]);
  const images = [];
  for (const encoded of encodedImages) {
    const image = Buffer.from(encoded.replace(/\s/g, ''), 'base64');
    if (image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) images.push(image);
  }
  return images;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function exportTopLevelContactSheet(file, basename, pages, includeInteractionBoard = false, flowBoards = [], stateBoards = []) {
  const target = join(DESIGN_DIR, `${basename}.png`);
  const temporaryTarget = join(DESIGN_DIR, `.cnas-preview-${basename}-${process.pid}.png`);
  const exportPages = contactSheetPages(pages, includeInteractionBoard, flowBoards, stateBoards);
  const pagePattern = `^(${pages.map((page) => page.id).join('|')})\\s`;
  const boardPattern = includeInteractionBoard ? `^${interactionBoardName(pages)}$` : '^$';
  const flowBoardPattern = flowBoards.length ? `^(${flowBoards.map((flowBoard) => escapeRegex(flowBoard.name)).join('|')})$` : '^$';
  const stateBoardPattern = stateBoards.length ? `^(${stateBoards.map((stateBoard) => escapeRegex(stateBoard.name)).join('|')})$` : '^$';
  const raw = await runInteractiveOnce({
    input: file,
    output: file,
    commands: [
      command('get_editor_state', { include_schema: false }),
      command('batch_get', { patterns: [{ name: pagePattern }, { name: boardPattern }, { name: flowBoardPattern }, { name: stateBoardPattern }], readDepth: 0 }),
      'save()',
      'exit()',
    ],
  });
  const nodes = extractJsonObjects(raw).flatMap((response) => response.nodes ?? []);
  const pageNodeName = (page) => page.isInteractionBoard || page.isFlowBoard || page.isStateBoard ? page.title : `${page.id} ${page.title}`;
  const pageNodes = new Map(nodes.filter((node) => exportPages.some((page) => node.name === pageNodeName(page)))
    .map((node) => [node.name, node]));
  if (pageNodes.size !== exportPages.length) {
    throw new Error(`Top-level page export lookup failed for ${basename}: ${pageNodes.size}/${exportPages.length}`);
  }
  const capture = async (node, expectedWidth, expectedHeight) => {
    const screenshot = await runInteractiveOnce({
      input: file,
      output: file,
      timeoutMs: 300_000,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('get_screenshot', { nodeId: node.id }),
        'save()',
        'exit()',
      ],
    });
    let image;
    try {
      image = screenshotBuffer(screenshot);
    } catch {
      const exportDir = join(DESIGN_DIR, `.capture-${basename}-${node.id}`);
      await rm(exportDir, { recursive: true, force: true });
      await mkdir(exportDir, { recursive: true });
      try {
        await runInteractiveOnce({
          input: file,
          output: file,
          commands: [
            command('get_editor_state', { include_schema: false }),
            command('export_nodes', { nodeIds: [node.id], outputDir: exportDir, scale: 1 }),
            'save()',
            'exit()',
          ],
        });
        const exported = (await readdir(exportDir)).find((name) => name.toLowerCase().endsWith('.png'));
        if (!exported) throw new Error(`Pencil export_nodes produced no PNG for ${node.name}`);
        image = await readFile(join(exportDir, exported));
      } finally {
        await rm(exportDir, { recursive: true, force: true });
      }
    }
    const metadata = await sharp(image).metadata();
    if (metadata.width === expectedWidth && metadata.height === expectedHeight) return image;
    return sharp(image).resize(expectedWidth, expectedHeight, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
  };
  let batchImages = [];
  try {
    const screenshotRaw = await runInteractiveOnce({
      input: file,
      output: file,
      timeoutMs: 900_000,
      commands: [
        command('get_editor_state', { include_schema: false }),
        ...exportPages.map((page) => command('get_screenshot', { nodeId: pageNodes.get(pageNodeName(page)).id })),
        'save()',
        'exit()',
      ],
    });
    batchImages = screenshotBuffers(screenshotRaw).slice(-exportPages.length);
    if (batchImages.length !== exportPages.length) batchImages = [];
  } catch {
    batchImages = [];
  }
  const layout = previewLayout(exportPages);
  const composites = [];
  for (let index = 0; index < exportPages.length; index += 1) {
    const page = exportPages[index];
    const node = pageNodes.get(pageNodeName(page));
    const image = batchImages[index] ?? await capture(node, page.width, page.height);
    const previewImage = await sharp(image).resize(Math.round(page.width * layout.scale), Math.round(page.height * layout.scale), { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
    composites.push({ input: previewImage, ...layout.position(page) });
    process.stdout.write(`Captured Pencil top-level page for ${basename}/${node.name}\n`);
  }
  try {
    await rm(temporaryTarget, { force: true });
    await sharp({
      create: { width: layout.width, height: layout.height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).composite(composites).png().toFile(temporaryTarget);
    await rm(target, { force: true });
    await rename(temporaryTarget, target);
  } finally {
    await rm(temporaryTarget, { force: true });
  }
  process.stdout.write(`Composited top-level frame preview ${target}\n`);
}

async function exportOverview(file, basename) {
  const domain = domains.find((candidate) => candidate.basename === basename);
  const overviewPages = domain?.pages ?? (basename === 'cnas-core-examples' ? coreExamplePages : null);
  if (overviewPages) {
    await exportTopLevelContactSheet(file, basename, overviewPages, false, domain ? flowBoardsForDomain(domain) : [], domain ? actionStateBoardsForDomain(domain) : []);
    return;
  }
  const exportDir = join(DESIGN_DIR, `.export-${basename}`);
  const target = join(DESIGN_DIR, `${basename}.png`);
  await rm(target, { force: true });
  await rm(exportDir, { recursive: true, force: true });
  await mkdir(exportDir, { recursive: true });

  try {
    if (process.env.CNAS_TILED_EXPORT === '1') throw new Error('Tiled export was explicitly requested');
    await runInteractiveOnce({
      input: file,
      output: file,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
        command('batch_get', { patterns: [{ name: '^CNAS LIMS Design Contact Sheet$' }], readDepth: 0 }),
        (raw) => {
          const sheet = extractJsonObjects(raw)
            .flatMap((response) => response.nodes ?? [])
            .find((node) => node.name === 'CNAS LIMS Design Contact Sheet');
          if (!sheet?.id) throw new Error('Contact sheet node ID was not returned by batch_get');
          return command('export_nodes', { nodeIds: [sheet.id], outputDir: exportDir, scale: 1 });
        },
        'save()',
        'exit()',
      ],
    });
    const exportedFiles = (await readdir(exportDir)).filter((name) => name.toLowerCase().endsWith('.png'));
    const domain = domains.find((candidate) => candidate.basename === basename);
    const expectedSize = domain
      ? { width: 6120, height: expectedSheetHeight(contactSheetPages(domain.pages, true, flowBoardsForDomain(domain))) }
      : basename === 'cnas-core-examples'
        ? { width: 6120, height: expectedSheetHeight(coreExamplePages) }
        : { width: 3000, height: 2380 };
    const exportedSize = exportedFiles.length === 1 ? await pngDimensions(join(exportDir, exportedFiles[0])) : null;
    if (exportedFiles.length === 1 && exportedSize.width === expectedSize.width && exportedSize.height === expectedSize.height) {
      await copyFile(join(exportDir, exportedFiles[0]), target);
      await rm(exportDir, { recursive: true, force: true });
      return;
    }
  } catch (error) {
    process.stdout.write(`Whole-sheet export unavailable for ${basename}; switching to tiled export: ${error.message.split('\n')[0]}\n`);
  }

  await rm(exportDir, { recursive: true, force: true });
  await mkdir(exportDir, { recursive: true });
  const document = JSON.parse(await readFile(file, 'utf8'));
  const sheet = document.children?.find((node) => node.name === 'CNAS LIMS Design Contact Sheet');
  if (!sheet || !Array.isArray(sheet.children) || !sheet.children.length) {
    throw new Error(`Contact sheet structure is missing from ${file}`);
  }
  const exportSource = join(exportDir, '.local-font.pen');
  await copyFile(file, exportSource);
  const exportableNodes = sheet.children.filter((node) => node.id && Number.isFinite(node.x) && Number.isFinite(node.y));
  const businessNodeIndexes = exportableNodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => (node.width === 1440 && node.height === 900) || (node.width === 390 && node.height === 844))
    .map(({ index }) => index);
  for (const [index] of exportableNodes.entries()) {
    await mkdir(join(exportDir, String(index).padStart(3, '0')), { recursive: true });
  }
  const captureBusinessTile = async (index) => {
    const node = exportableNodes[index];
    await copyFile(file, exportSource);
    const raw = await runInteractiveOnce({
      input: exportSource,
      output: exportSource,
      timeoutMs: 300_000,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('get_screenshot', { nodeId: node.id }),
        'save()',
        'exit()',
      ],
    });
    const clean = raw.replace(ANSI_RE, '');
    const dataMatches = [...clean.matchAll(/"data"\s*:\s*"([^"]+)"/g)];
    const encoded = (dataMatches.at(-1)?.[1] ?? clean.match(/iVBORw0KGgo[A-Za-z0-9+/=\r\n]+/)?.[0])?.replace(/\s/g, '');
    if (!encoded) throw new Error('Pencil screenshot did not return PNG data');
    const image = Buffer.from(encoded, 'base64');
    if (!image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error('Pencil screenshot returned invalid PNG data');
    }
    const metadata = await sharp(image).metadata();
    const expectedWidth = Math.round(node.width);
    const expectedHeight = Math.round(node.height);
    const rendered = metadata.width === expectedWidth && metadata.height === expectedHeight
      ? image
      : await sharp(image).resize(expectedWidth, expectedHeight, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
    await writeFile(join(exportDir, String(index).padStart(3, '0'), `${node.id}.png`), rendered);
  };
  for (const index of businessNodeIndexes) {
    try {
      await captureBusinessTile(index);
      process.stdout.write(`Captured Pencil business page for ${basename}/${exportableNodes[index].name}\n`);
    } catch (error) {
      process.stdout.write(`Initial page capture failed for ${basename}/${exportableNodes[index].name}: ${error.message.split('\n')[0]}\n`);
    }
  }

  const missingTileIndexes = async () => {
    const missing = [];
    for (const [index] of exportableNodes.entries()) {
      const tileDir = join(exportDir, String(index).padStart(3, '0'));
      const files = (await readdir(tileDir)).filter((name) => name.toLowerCase().endsWith('.png'));
      if (files.length !== 1) missing.push(index);
    }
    return missing;
  };
  let missing = await missingTileIndexes();
  const xmlEscape = (value) => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  const resolveDesignValue = (value, fallback) => String(value ?? fallback).startsWith('$')
    ? document.variables?.[String(value).slice(1)]?.value ?? fallback
    : value ?? fallback;
  for (const index of missing.filter((tileIndex) => exportableNodes[tileIndex].type === 'text')) {
    const node = exportableNodes[index];
    const fontSize = Number(node.fontSize) || 14;
    const lines = String(node.content ?? '').split('\n');
    const lineHeight = Math.ceil(fontSize * 1.35);
    const width = Math.max(1, Math.ceil(Number(node.width) || 1));
    const height = Math.max(1, Math.ceil(Number(node.height) || lines.length * lineHeight));
    const fill = resolveDesignValue(node.fill, '#303133');
    const alignment = node.textAlign === 'center'
      ? { x: width / 2, anchor: 'middle' }
      : node.textAlign === 'right'
        ? { x: width, anchor: 'end' }
        : { x: 0, anchor: 'start' };
    const tspans = lines.map((line, lineIndex) => `<tspan x="${alignment.x}" dy="${lineIndex ? lineHeight : fontSize}">${xmlEscape(line)}</tspan>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="${alignment.x}" y="0" text-anchor="${alignment.anchor}" font-family="Source Han Sans SC" font-size="${fontSize}" font-weight="${xmlEscape(node.fontWeight ?? '400')}" fill="${xmlEscape(fill)}">${tspans}</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(join(exportDir, String(index).padStart(3, '0'), 'text-fallback.png'));
    process.stdout.write(`Rendered local text fallback for ${basename}/${node.name}\n`);
  }
  missing = await missingTileIndexes();
  const simpleOverviewIndexes = missing.filter((index) => {
    const name = exportableNodes[index].name ?? '';
    return name.startsWith('Overview Token/') || name === 'Overview Note' || name === 'Contact Sheet Header';
  });
  for (const index of simpleOverviewIndexes) {
    const node = exportableNodes[index];
    const width = Math.max(1, Math.ceil(Number(node.width) || 1));
    const height = Math.max(1, Math.ceil(Number(node.height) || 1));
    const frameFill = resolveDesignValue(node.fill, '#FFFFFF');
    const frameStroke = resolveDesignValue(node.stroke, '#EBEEF5');
    const childSvg = (node.children ?? []).map((child) => {
      if (child.type === 'rectangle') {
        return `<rect x="${child.x}" y="${child.y}" width="${child.width}" height="${child.height}" rx="${child.cornerRadius ?? 0}" fill="${xmlEscape(resolveDesignValue(child.fill, '#FFFFFF'))}"/>`;
      }
      if (child.type === 'text') {
        const childFontSize = Number(child.fontSize) || 14;
        return `<text x="${child.x}" y="${Number(child.y) + childFontSize}" font-family="Source Han Sans SC" font-size="${childFontSize}" font-weight="${xmlEscape(child.fontWeight ?? '400')}" fill="${xmlEscape(resolveDesignValue(child.fill, '#303133'))}">${xmlEscape(child.content ?? '')}</text>`;
      }
      return '';
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${node.cornerRadius ?? 0}" fill="${xmlEscape(frameFill)}" stroke="${xmlEscape(frameStroke)}" stroke-width="${node.strokeWidth ?? 1}"/>${childSvg}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(join(exportDir, String(index).padStart(3, '0'), 'overview-fallback.png'));
    process.stdout.write(`Rendered local overview fallback for ${basename}/${node.name}\n`);
  }
  missing = await missingTileIndexes();
  for (const index of missing.filter((tileIndex) => businessNodeIndexes.includes(tileIndex))) {
    try {
      await captureBusinessTile(index);
      process.stdout.write(`Captured Pencil screenshot fallback for ${basename}/${exportableNodes[index].name}\n`);
    } catch (error) {
      process.stdout.write(`Screenshot fallback failed for ${basename}/${exportableNodes[index].name}: ${error.message.split('\n')[0]}\n`);
    }
  }
  missing = await missingTileIndexes();
  for (let retry = 1; missing.length && retry <= 3; retry += 1) {
    for (const index of missing) {
      try {
        if (!businessNodeIndexes.includes(index)) throw new Error('Only business pages may use Pencil screenshot retry');
        await captureBusinessTile(index);
      } catch (error) {
        process.stdout.write(`Retry ${retry} failed for ${basename}/${exportableNodes[index].name}: ${error.message.split('\n')[0]}\n`);
      }
    }
    missing = await missingTileIndexes();
  }
  if (missing.length) {
    throw new Error(`Tiled export remained incomplete for ${basename}: ${missing.map((index) => exportableNodes[index].name).join(', ')}`);
  }

  const composites = [];
  for (const [index, node] of exportableNodes.entries()) {
    const tileDir = join(exportDir, String(index).padStart(3, '0'));
    const files = (await readdir(tileDir)).filter((name) => name.toLowerCase().endsWith('.png'));
    if (files.length !== 1) throw new Error(`Tiled export failed for ${basename}/${node.name}`);
    composites.push({
      input: await readFile(join(tileDir, files[0])),
      left: Math.round(node.x),
      top: Math.round(node.y),
    });
  }
  await sharp({
    create: {
      width: Math.round(sheet.width),
      height: Math.round(sheet.height),
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).composite(composites).png().toFile(target);
  await rm(exportDir, { recursive: true, force: true });
  process.stdout.write(`Composited tiled preview ${target}\n`);
}

async function exportDesignSystemPreview(file) {
  await exportOverview(file, 'cnas-design-system');
}

async function buildModuleDesign(domain, componentIds) {
  const output = join(DESIGN_DIR, `${domain.basename}.pen`);
  await rm(output, { force: true });
  await runInteractive({
    input: TEMPLATE,
    output,
    commands: [
      command('get_editor_state', { include_schema: false }),
      command('batch_design', { input: pageOperations(domain.pages, componentIds, generationOptionsForDomain(domain)) }),
      command('get_variables', {}),
      command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
      'save()',
      'exit()',
    ],
  });
  if (!process.env.CNAS_SKIP_PREVIEW) await exportOverview(output, domain.basename);
}

if (process.argv.includes('--generate-design-system') || process.argv.includes('--export-design-system')) {
  await mkdir(DESIGN_DIR, { recursive: true });
  const output = join(DESIGN_DIR, 'cnas-design-system.pen');
  if (process.argv.includes('--generate-design-system')) {
    await rm(output, { force: true });
    const templateRaw = await runInteractive({
      output,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_design', { input: templateOperations() }),
        command('batch_get', { patterns: [{ reusable: true }], readDepth: 2 }),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 6 }),
        'save()',
        'exit()',
      ],
    });
    const componentIds = componentIdMap(templateRaw);
    await runInteractive({
      input: output,
      output,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_design', { input: designSystemOperations(componentIds) }),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 6 }),
        'save()',
        'exit()',
      ],
    });
  } else if (!existsSync(output)) {
    throw new Error(`Missing design system source: ${output}`);
  }
  await exportDesignSystemPreview(output);
  process.stdout.write('Generated CNAS Pencil design system and preview.\n');
  process.exit(0);
}

if (process.argv.includes('--generate-core-examples') || process.argv.includes('--export-core-examples')) {
  await mkdir(DESIGN_DIR, { recursive: true });
  const output = join(DESIGN_DIR, 'cnas-core-examples.pen');
  if (process.argv.includes('--generate-core-examples')) {
    await rm(output, { force: true });
    await rm(TEMPLATE, { force: true });
    const templateRaw = await runInteractive({
      output: TEMPLATE,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_design', { input: templateOperations() }),
        command('batch_get', { patterns: [{ reusable: true }], readDepth: 2 }),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
        'save()',
        'exit()',
      ],
    });
    const componentIds = componentIdMap(templateRaw);
    await runInteractive({
      input: TEMPLATE,
      output,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_design', { input: pageOperations(coreExamplePages, componentIds, { includeInteractionBoard: false }) }),
        command('get_variables', {}),
        command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
        'save()',
        'exit()',
      ],
    });
  } else if (!existsSync(output)) {
    throw new Error(`Missing core example source: ${output}`);
  }
  await exportOverview(output, 'cnas-core-examples');
  if (process.argv.includes('--generate-core-examples')) await rm(TEMPLATE, { force: true });
  process.stdout.write('Generated CNAS core example preview.\n');
  process.exit(0);
}

const exportOneArg = process.argv.find((argument) => argument.startsWith('--export-one='));
if (process.argv.includes('--export-existing') || exportOneArg) {
  const selectedDomains = exportOneArg
    ? domains.filter((domain) => domain.basename === exportOneArg.slice('--export-one='.length))
    : domains;
  if (!selectedDomains.length) throw new Error(`Unknown design basename: ${exportOneArg}`);
  for (const domain of selectedDomains) {
    const file = join(DESIGN_DIR, `${domain.basename}.pen`);
    if (!existsSync(file)) throw new Error(`Missing design file: ${file}`);
    await exportOverview(file, domain.basename);
  }
  process.stdout.write('Exported all existing CNAS Pencil previews.\n');
  process.exit(0);
}

const generateOneArg = process.argv.find((argument) => argument.startsWith('--generate-module='));
if (process.argv.includes('--generate-modules') || generateOneArg) {
  await mkdir(DESIGN_DIR, { recursive: true });
  validatePageSpecs();
  const selectedDomains = generateOneArg
    ? domains.filter((domain) => domain.basename === generateOneArg.slice('--generate-module='.length))
    : domains;
  if (!selectedDomains.length) throw new Error(`Unknown design basename: ${generateOneArg}`);

  await rm(TEMPLATE, { force: true });
  const templateRaw = await runInteractive({
    output: TEMPLATE,
    commands: [
      command('get_editor_state', { include_schema: false }),
      command('batch_design', { input: templateOperations() }),
      command('batch_get', { patterns: [{ reusable: true }], readDepth: 2 }),
      command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
      'save()',
      'exit()',
    ],
  });
  const componentIds = componentIdMap(templateRaw);
  for (const domain of selectedDomains) {
    await buildModuleDesign(domain, componentIds);
  }
  await rm(TEMPLATE, { force: true });
  process.stdout.write(`Generated ${selectedDomains.length} CNAS module design set(s).\n`);
  process.exit(0);
}

const invokedAsScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsScript) {
await mkdir(DESIGN_DIR, { recursive: true });
validatePageSpecs();
await writePageMap();
await rm(TEMPLATE, { force: true });
const templateRaw = await runInteractive({
  output: TEMPLATE,
  commands: [
    command('get_editor_state', { include_schema: false }),
    command('batch_design', { input: templateOperations() }),
    command('batch_get', { patterns: [{ reusable: true }], readDepth: 2 }),
    command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
    'save()',
    'exit()',
  ],
});
const componentIds = componentIdMap(templateRaw);
const resumeGeneration = process.argv.includes('--resume');
const forceRebuild = process.argv.includes('--force-rebuild');

for (const domain of domains) {
  const output = join(DESIGN_DIR, `${domain.basename}.pen`);
  const preview = join(DESIGN_DIR, `${domain.basename}.png`);
  const currentNavigation = !forceRebuild && resumeGeneration && await designUsesCurrentNavigation(output, domain);
  if (currentNavigation && existsSync(preview)) {
    process.stdout.write(`Keeping completed design ${domain.basename}\n`);
    continue;
  }
  if (currentNavigation) {
    await exportOverview(output, domain.basename);
    continue;
  }
  await buildModuleDesign(domain, componentIds);
}

await rm(TEMPLATE, { force: true });
for (const legacy of legacyDomains) {
  await rm(join(DESIGN_DIR, `${legacy.basename}.pen`), { force: true });
  await rm(join(DESIGN_DIR, `${legacy.basename}.png`), { force: true });
}
await rm(join(DESIGN_DIR, 'prompts'), { recursive: true, force: true });
await rm(join(DESIGN_DIR, '.export-debug-dir'), { recursive: true, force: true });
process.stdout.write('All CNAS Pencil design files generated.\n');
}
