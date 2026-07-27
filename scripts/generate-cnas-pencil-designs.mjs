import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';

import { businessDomains } from './cnas-page-specs-business.mjs';
import { resourceDomains } from './cnas-page-specs-resources.mjs';
import { governanceDomains } from './cnas-page-specs-governance.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const DESIGN_DIR = join(ROOT, 'design');
const TEMPLATE = join(DESIGN_DIR, '.cnas-base-template.pen');
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
const navigationModel = domains.map((domain) => ({
  root: domain.root,
  children: [...new Set(domain.pages.filter((page) => !page.id.startsWith('M') && page.kind !== 'login').map((page) => page.menu))],
}));
const forbiddenVisibleTerms = ['当前模块', '演示数据', '演示环境', '全部用户', 'DEMO', '（演示）'];

function pencilString(value) {
  return JSON.stringify(value);
}

async function runInteractiveOnce({ input, output, commands, timeoutMs = 420_000 }) {
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
      rejectPromise(new Error(`${message}\n${raw.slice(-5000)}`));
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
  "surface-muted":{type:"color",value:"#F0F2F5"},"surface-skeleton":{type:"color",value:"#E9EEF2"},
  "text-primary":{type:"color",value:"#303133"},"text-regular":{type:"color",value:"#606266"},
  "text-secondary":{type:"color",value:"#909399"},"text-placeholder":{type:"color",value:"#A8ABB2"},
  "text-disabled":{type:"color",value:"#C0C4CC"},"border-base":{type:"color",value:"#DCDFE6"},
  "border-light":{type:"color",value:"#EBEEF5"},"border-extra-light":{type:"color",value:"#F2F6FC"},
  "font-cn":{type:"string",value:"Noto Sans SC"},"component-small":{type:"number",value:24},
  "component-default":{type:"number",value:32},"component-large":{type:"number",value:40},
  "radius-small":{type:"number",value:2},"radius-base":{type:"number",value:4},
  "radius-round":{type:"number",value:20},"radius-circle":{type:"number",value:100}
},true)
function Safe(c){return String(c).replaceAll("演示数据","业务数据").replaceAll("演示环境","需求评审环境").replaceAll("全部用户","已认证用户").replaceAll("（演示）","").replaceAll("DEMO","LAB").replaceAll("演示","业务")}
function T(p,n,c,x,y,w,s=14,color="$text-regular",weight="400",align="left",id=null){return Insert(p,{type:"text",name:n,content:Safe(c),x,y,width:w,fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width",...(id?{id}:{})})}
function Box(p,n,x,y,w,h,fill="$surface-panel",radius=6,stroke="$border-light",id=null){return Insert(p,{type:"frame",name:n,x,y,width:w,height:h,fill,cornerRadius:radius,stroke,strokeWidth:1,layout:"none",clip:true,...(id?{id}:{})})}
function Ico(p,n,icon,x,y,color="$text-secondary",size=16){return Insert(p,{type:"icon",name:n,library:"lucide",icon,x,y,width:size,height:size,fill:color})}
palette=Insert(document,{type:"frame",id:"componentsTokens",name:"00 Components & Tokens",x:0,y:0,width:6120,height:620,fill:"$surface-page",layout:"none",clip:true,placeholder:true})
T(palette,"Design System Title","CNAS 实验室信息管理系统 · web-ele 设计基线",40,32,900,24,"$text-primary","700")
T(palette,"Design System Subtitle","华衡检测实验室 · Vben Admin 5.x + Element Plus · Noto Sans SC",40,70,1000,14)
for(const [i,item] of [["主色","$brand-primary"],["辅助蓝","$brand-secondary"],["成功","$semantic-success"],["警告","$semantic-warning"],["危险","$semantic-danger"],["信息","$semantic-info"]].entries()){sw=Box(palette,"Token/"+item[0],40+i*176,112,160,76,"$surface-panel",6);Insert(sw,{type:"rectangle",name:"Swatch",x:12,y:12,width:40,height:40,fill:item[1],cornerRadius:4});T(sw,"Token Name",item[0],64,20,80,14,"$text-primary","600")}
primary=Box(palette,"Button/Primary",40,220,112,36,"$brand-primary",4,"$brand-primary","cmpButtonPrimary");Update(primary,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});primaryLabel=T(primary,"Label","主要操作",0,0,112,14,"#FFFFFF","600","center","cmpButtonPrimaryLabel");Update(primaryLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
secondary=Box(palette,"Button/Secondary",168,220,112,36,"$surface-panel",4,"$border-base","cmpButtonSecondary");Update(secondary,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});secondaryLabel=T(secondary,"Label","次要操作",0,0,112,14,"$text-regular","500","center","cmpButtonSecondaryLabel");Update(secondaryLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
danger=Box(palette,"Button/Danger",296,220,112,36,"$semantic-danger",4,"$semantic-danger","cmpButtonDanger");Update(danger,{reusable:true,layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});dangerLabel=T(danger,"Label","高风险操作",0,0,112,14,"#FFFFFF","600","center","cmpButtonDangerLabel");Update(dangerLabel,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"})
input=Box(palette,"Form/Input",40,280,240,36,"$surface-panel",4,"$border-base","cmpFormInput");Update(input,{reusable:true});T(input,"Placeholder","请输入或选择",12,8,190,14,"$text-secondary","400","left","cmpFormInputValue")
for(const [i,item] of [["Tag/Success","合格","#F0F9EB","$semantic-success","cmpTagSuccess","cmpTagSuccessLabel"],["Tag/Warning","待处理","#FDF6EC","$semantic-warning","cmpTagWarning","cmpTagWarningLabel"],["Tag/Danger","已阻断","#FEF0F0","$semantic-danger","cmpTagDanger","cmpTagDangerLabel"],["Tag/Info","草稿","#F4F4F5","$semantic-info","cmpTagInfo","cmpTagInfoLabel"]].entries()){tag=Box(palette,item[0],320+i*96,280,80,28,item[2],4,item[3],item[4]);Update(tag,{reusable:true});T(tag,"Label",item[1],8,5,64,12,item[3],"600","center",item[5])}
alert=Box(palette,"Alert/Warning",40,340,760,48,"#FDF6EC",4,"$semantic-warning","cmpAlertWarning");Update(alert,{reusable:true});Ico(alert,"Icon","triangle-alert",14,15,"$semantic-warning",18);T(alert,"Message","检测资源或授权不满足时阻断流程，并保留处理路径与审计记录。",44,13,690,14,"#7A4C00","500","left","cmpAlertWarningMessage")
tableHeader=Box(palette,"Table/Header",40,414,920,40,"$surface-muted",0,"$border-base","cmpTableHeader");Update(tableHeader,{reusable:true});for(const [i,label] of ["编号","业务对象","责任人","更新时间","状态","操作"].entries())T(tableHeader,"Column "+label,label,16+i*150,11,130,12,"$text-regular","600","left","cmpTableHeaderCol"+i)
tableRow=Box(palette,"Table/Row",40,454,920,44,"$surface-panel",0,"$border-light","cmpTableRow");Update(tableRow,{reusable:true});for(const [i,label] of ["WT-260727-001","检测业务记录","审核人员","2026-07-27 10:30","待处理","查看"].entries())T(tableRow,"Cell "+i,label,16+i*150,13,130,12,i===5?"$brand-secondary":"$text-regular",i===5?"600":"400","left","cmpTableRowCell"+i)
skeleton=Box(palette,"State/Skeleton",1000,220,300,128,"$surface-panel",6,"$border-light","cmpStateSkeleton");Update(skeleton,{reusable:true});for(const [i,w] of [220,260,180].entries())Insert(skeleton,{type:"rectangle",name:"Skeleton Line",x:20,y:22+i*30,width:w,height:12,fill:"#E9EEF2",cornerRadius:4})
empty=Box(palette,"State/Empty",1320,220,300,128,"$surface-panel",6,"$border-light","cmpStateEmpty");Update(empty,{reusable:true});Ico(empty,"Icon","inbox",134,26,"$text-secondary",30);T(empty,"Title","暂无数据",90,66,120,14,"$text-regular","600","center");T(empty,"Help","调整筛选条件后重试",60,90,160,12,"$text-secondary","400","center")
switchOn=Box(palette,"Form/Switch/On",1660,220,48,24,"$brand-primary",12,"$brand-primary","cmpSwitchOn");Update(switchOn,{reusable:true});Insert(switchOn,{type:"ellipse",name:"Switch Thumb",x:26,y:2,width:20,height:20,fill:"#FFFFFF"})
switchOff=Box(palette,"Form/Switch/Off",1724,220,48,24,"#D1D5DB",12,"#D1D5DB","cmpSwitchOff");Update(switchOff,{reusable:true});Insert(switchOff,{type:"ellipse",name:"Switch Thumb",x:2,y:2,width:20,height:20,fill:"#FFFFFF"})
Update(palette,{placeholder:false})
`;
}

function designSystemOperations() {
  return String.raw`
function DST(p,n,c,x,y,w,s=14,color="$text-regular",weight="400",align="left"){return Insert(p,{type:"text",name:n,content:c,x,y,width:w,fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width"})}
function DSB(p,n,x,y,w,h,fill="$surface-panel",radius=6,stroke="$border-light"){return Insert(p,{type:"frame",name:n,x,y,width:w,height:h,fill,cornerRadius:radius,stroke,strokeWidth:1,layout:"none",clip:true})}
function DSSection(title,x,y,w,h){const s=DSB(ds,"Section/"+title,x,y,w,h,"$surface-panel",6,"$border-light");DST(s,"Section Title",title,20,18,w-40,18,"$text-primary","700");Insert(s,{type:"rectangle",name:"Section Divider",x:20,y:50,width:w-40,height:1,fill:"$border-light"});return s}
function DSButton(p,label,x,y,w=104,tone="primary",disabled=false){const colors=tone==="primary"?["$brand-primary","#FFFFFF","$brand-primary"]:tone==="danger"?["$semantic-danger","#FFFFFF","$semantic-danger"]:["#FFFFFF","$text-regular","$border-base"];const b=DSB(p,"Button/"+label,x,y,w,34,disabled?"#F5F7FA":colors[0],4,disabled?"$border-light":colors[2]);Update(b,{layout:"horizontal",justifyContent:"center",alignItems:"center",padding:0});labelNode=DST(b,"Label",label,0,0,w,13,disabled?"#C0C4CC":colors[1],"600","center");Update(labelNode,{width:"fill_container",height:"fill_container",textGrowth:"fixed-width-height",textAlignVertical:"middle"});return b}
function DSField(p,label,value,x,y,w=250,state="default"){DST(p,"Field Label/"+label,label,x,y,w,12,state==="error"?"$semantic-danger":"$text-regular","500");const b=DSB(p,"Form/"+label,x,y+22,w,36,state==="disabled"?"#F5F7FA":"#FFFFFF",4,state==="error"?"$semantic-danger":"$border-base");DST(b,"Value",value,12,9,w-24,13,state==="disabled"?"#C0C4CC":"$text-secondary");return b}
function DSTag(p,label,x,y,tone="info"){const colors={success:["#F0F9EB","$semantic-success"],warning:["#FDF6EC","$semantic-warning"],danger:["#FEF0F0","$semantic-danger"],info:["#F4F4F5","$semantic-info"],brand:["#E6FFFA","$brand-primary"]}[tone];const w=Math.max(64,label.length*14+18);const b=DSB(p,"Tag/"+label,x,y,w,28,colors[0],4,colors[1]);DST(b,"Label",label,0,6,w,12,colors[1],"600","center");return b}
ds=Insert(document,{type:"frame",id:"designSystemSheet",name:"CNAS LIMS Design Contact Sheet",x:0,y:0,width:3000,height:2380,fill:"#E9EEF2",layout:"none",clip:true,placeholder:true})
Insert(ds,{type:"rectangle",name:"Header",x:0,y:0,width:3000,height:146,fill:"$brand-primary-dark"})
DST(ds,"Title","CNAS LIMS · web-ele 设计系统组件",40,30,1500,32,"#FFFFFF","700")
DST(ds,"Subtitle","华衡检测实验室 · Vben Admin 5.x + Element Plus 组件语义基线",40,78,1600,15,"#D6F4EF","400")
DST(ds,"Version","DESIGN SYSTEM 1.0",2580,44,360,14,"#BDE8E1","600","right")

tokens=DSSection("01 设计令牌",40,176,920,560)
for(const [i,item] of [["主色","$brand-primary"],["辅助蓝","$brand-secondary"],["成功","$semantic-success"],["警告","$semantic-warning"],["危险","$semantic-danger"],["信息","$semantic-info"],["页面","$surface-page"],["面板","$surface-panel"]].entries()){const x=20+(i%4)*216,y=72+Math.floor(i/4)*96;const b=DSB(tokens,"Token/"+item[0],x,y,196,76,"#FFFFFF",4,"$border-light");Insert(b,{type:"rectangle",name:"Swatch",x:12,y:12,width:42,height:42,fill:item[1],cornerRadius:4});DST(b,"Name",item[0],66,18,112,13,"$text-primary","600")}
DST(tokens,"Typography","字体 Noto Sans SC · 12 / 14 / 16 / 20 / 24 / 32",20,286,860,14,"$text-regular","600")
for(const [i,size] of [12,14,16,20,24,32].entries())DST(tokens,"Type/"+size,"Aa 中文 "+size,20+i*142,326,128,size,"$text-primary",size>=20?"700":"400")
DST(tokens,"Spacing","间距 4 / 8 / 12 / 16 / 24 / 32 · 圆角 2 / 4 / 20 / 100 · 字间距 0",20,404,860,14,"$text-regular","600")
DST(tokens,"Responsive","断点：390 移动 · 1280 窄桌面 · 1440 标准桌面",20,448,860,14,"$text-secondary")

nav=DSSection("02 导航",990,176,920,560)
sidebar=DSB(nav,"Navigation/Sidebar",20,72,220,450,"$brand-primary-dark",6,"$brand-primary-dark");DST(sidebar,"Brand","CNAS LIMS",20,18,170,18,"#FFFFFF","700");for(const [i,label] of ["工作台","客户与委托","样品管理","检测管理","报告管理","体系管理"].entries()){if(i===2)Insert(sidebar,{type:"rectangle",name:"Active",x:12,y:62+i*48,width:196,height:36,fill:"#FFFFFF20",cornerRadius:4});DST(sidebar,"Menu/"+label,label,28,71+i*48,160,14,"#FFFFFF",i===2?"700":"400")}
top=DSB(nav,"Navigation/Topbar",260,72,630,56,"#FFFFFF",4,"$border-light");DST(top,"Search","搜索样品、任务、报告、文件",18,18,320,14,"$text-secondary");DST(top,"Account","通知  ·  当前用户",430,18,180,13,"$text-regular","500","right")
crumb=DSB(nav,"Navigation/Breadcrumb",260,148,630,44,"#FFFFFF",4,"$border-light");DST(crumb,"Text","样品管理 / 样品台账 / 样品详情",16,14,560,12,"$text-secondary")
tabs=DSB(nav,"Navigation/Tabs",260,212,630,48,"#FFFFFF",4,"$border-light");for(const [i,label] of ["综合工作台","样品台账","样品详情"].entries()){DST(tabs,"Tab/"+label,label,18+i*170,16,150,13,i===1?"$brand-primary":"$text-secondary",i===1?"600":"400");if(i===1)Insert(tabs,{type:"rectangle",name:"Active Line",x:18+i*170,y:45,width:72,height:3,fill:"$brand-primary"})}
tree=DSB(nav,"Navigation/Tree",260,280,300,242,"#FAFCFC",4,"$border-light");DST(tree,"Title","树形二级菜单",16,14,240,14,"$text-primary","600");for(const [i,label] of ["▾ 样品管理","  ▸ 样品接收","  ▸ 样品台账","  ▸ 样品流转","▸ 检测管理"].entries())DST(tree,"Node/"+label,label,16,52+i*34,250,13,i===2?"$brand-primary":"$text-regular",i===2?"600":"400")

actions=DSSection("03 操作与反馈",1940,176,1020,560)
DSButton(actions,"主要操作",20,74,108,"primary");DSButton(actions,"次要操作",144,74,108,"secondary");DSButton(actions,"危险操作",268,74,108,"danger");DSButton(actions,"禁用操作",392,74,108,"secondary",true);DSButton(actions,"批量处理",516,74,108,"primary")
for(const [i,item] of [["通过","success"],["待处理","warning"],["已阻断","danger"],["草稿","info"],["进行中","brand"]].entries())DSTag(actions,item[0],20+i*118,134,item[1])
alert=DSB(actions,"Alert/Warning",20,196,960,64,"#FDF6EC",4,"$semantic-warning");DST(alert,"Message","资源、授权或数据完整性不满足时阻断流程，并提示恢复路径。",18,22,900,14,"#7A4C00","600")
result=DSB(actions,"Result/AccessDenied",20,282,458,220,"#FAFCFC",4,"$border-light");DST(result,"Icon","!",204,28,50,32,"$semantic-danger","700","center");DST(result,"Title","权限不足",90,78,278,18,"$text-primary","700","center");DST(result,"Help","当前角色无权执行该操作，请联系权限管理员。",48,116,362,13,"$text-regular","400","center");DSButton(result,"返回上一页",170,162,118,"secondary")
modal=DSB(actions,"Modal/Confirm",502,282,478,220,"#FFFFFF",6,"$border-base");DST(modal,"Title","确认提交",20,18,300,16,"$text-primary","700");DST(modal,"Content","提交后进入下一审批节点，操作将记录审计轨迹。",20,62,430,13,"$text-regular");DSButton(modal,"取消",232,164,96,"secondary");DSButton(modal,"确认",342,164,96,"primary")

forms=DSSection("04 表单",40,766,1390,620)
DSField(forms,"文本输入","请输入内容",20,74,300);DSField(forms,"下拉选择","请选择",340,74,300);DSField(forms,"日期范围","2026-07-01 至 2026-07-31",660,74,300);DSField(forms,"级联选择","场所 / 专业组 / 项目",980,74,370)
DSField(forms,"校验错误","该字段不能为空",20,164,300,"error");DSField(forms,"只读字段","受控编号 LAB-026",340,164,300,"disabled");DSField(forms,"禁用字段","当前状态不可编辑",660,164,300,"disabled")
upload=DSB(forms,"Upload/Dropzone",20,272,500,180,"#FAFCFC",6,"$border-base");DST(upload,"Icon","上传",200,38,100,20,"$brand-secondary","700","center");DST(upload,"Hint","拖拽文件到此处，或点击选择文件",60,82,380,14,"$text-regular","600","center");DST(upload,"Rule","支持受控格式；失败后保留重试入口",60,118,380,12,"$text-secondary","400","center")
switches=DSB(forms,"Form/Switches",548,272,376,180,"#FFFFFF",4,"$border-light");DST(switches,"Title","开关与选择",16,16,300,14,"$text-primary","600");for(const [i,label] of ["启用到期提醒","要求电子签名","锁定归档记录"].entries()){sw=DSB(switches,"Switch/"+label,18,56+i*38,48,24,i<2?"$brand-primary":"#D1D5DB",12,i<2?"$brand-primary":"#D1D5DB");Insert(sw,{type:"ellipse",name:"Switch Thumb",x:i<2?26:2,y:2,width:20,height:20,fill:"#FFFFFF"});DST(switches,"Label",label,78,60+i*38,250,13,"$text-regular")}
validation=DSB(forms,"Form/Validation",952,272,398,180,"#FEF0F0",4,"$semantic-danger");DST(validation,"Title","表单校验",16,16,300,14,"$semantic-danger","700");DST(validation,"Content","• 必填项缺失\n• 日期范围无效\n• 上传文件校验失败\n• 无权限字段保持只读",16,52,350,13,"$text-regular")

data=DSSection("05 数据展示",1460,766,1500,620)
filter=DSB(data,"VbenForm/FilterBar",20,72,1460,80,"#FAFCFC",4,"$border-light");DSField(filter,"关键词","输入编号或名称",16,10,300);DSField(filter,"状态","请选择",334,10,240);DSButton(filter,"查询",1170,34,92,"primary");DSButton(filter,"重置",1276,34,92,"secondary")
table=DSB(data,"VxeTable",20,174,980,340,"#FFFFFF",4,"$border-light");Insert(table,{type:"rectangle",name:"Header",x:0,y:0,width:980,height:42,fill:"$surface-muted"});for(const [i,label] of ["编号","业务对象","责任人","更新时间","状态","操作"].entries())DST(table,"Header/"+label,label,16+i*158,13,140,12,"$text-regular","600");for(let r=0;r<5;r++){Insert(table,{type:"rectangle",name:"Row",x:0,y:42+r*48,width:980,height:48,fill:r%2?"#FAFCFC":"#FFFFFF",stroke:"$border-light",strokeWidth:{bottom:1}});for(const [i,value] of [["LAB-00"+(r+1)],["受控业务记录"],["责任人员"],["2026-07-27"],[r===2?"待处理":"有效"],["查看  编辑"]].entries())DST(table,"Cell",value[0],16+i*158,58+r*48,140,12,i===5?"$brand-primary":"$text-regular",i===5?"600":"400")}
DST(table,"Pagination","共 58 条  20 条/页  1  2  3  下一页",604,302,350,12,"$text-secondary","400","right")
states=DSB(data,"Data/States",1024,174,456,340,"#FAFCFC",4,"$border-light");DST(states,"Title","加载、空态与骨架屏",18,18,400,14,"$text-primary","600");for(const [i,w] of [330,380,260].entries())Insert(states,{type:"rectangle",name:"Skeleton",x:24,y:64+i*30,width:w,height:12,fill:"#E9EEF2",cornerRadius:4});DST(states,"Empty","暂无符合条件的数据",104,196,248,16,"$text-regular","600","center");DST(states,"Help","调整筛选条件后重试",104,230,248,12,"$text-secondary","400","center");DSButton(states,"清空筛选",164,272,128,"secondary")

workflow=DSSection("06 流程与审批",40,1416,1390,900)
DST(workflow,"Steps Title","Steps 步骤条",20,72,300,14,"$text-primary","600");for(const [i,label] of ["提交申请","业务审核","批准确认","完成"].entries()){const x=28+i*310;if(i<3)Insert(workflow,{type:"rectangle",name:"Step Connector",x:x+28,y:125,width:282,height:4,fill:i<1?"$brand-primary":"$border-base"});Insert(workflow,{type:"ellipse",name:"Step",x,y:112,width:28,height:28,fill:i<2?"$brand-primary":"#E5E7EB"});DST(workflow,"Step Number",String(i+1),x,118,28,12,i<2?"#FFFFFF":"$text-secondary","700","center");DST(workflow,"Step Label",label,x+40,118,180,13,i<2?"$text-primary":"$text-secondary",i===1?"600":"400")}
timeline=DSB(workflow,"Timeline/Audit",20,176,520,330,"#FAFCFC",4,"$border-light");DST(timeline,"Title","流程与审计时间线",18,18,420,15,"$text-primary","600");for(const [i,label] of ["提交申请 · 10:12","审核通过 · 11:05","等待批准 · 当前","退回补充 · 可选路径"].entries()){Insert(timeline,{type:"ellipse",name:"Dot",x:24,y:62+i*58,width:10,height:10,fill:i===2?"$semantic-warning":i===3?"$semantic-danger":"$brand-primary"});DST(timeline,"Event",label,52,57+i*58,420,13,"$text-regular",i===2?"600":"400")}
approval=DSB(workflow,"Approval/Opinion",566,176,784,330,"#FFFFFF",4,"$border-light");DST(approval,"Title","审批意见与电子签名确认",18,18,500,15,"$text-primary","600");DSField(approval,"审批意见","请填写明确的审核意见",18,62,748);sign=DSB(approval,"Electronic Signature",18,164,748,76,"#F0F5F4",4,"$border-base");DST(sign,"Label","身份确认后提交；签名层级 [待确认]",18,18,600,14,"$text-primary","600");DSButton(sign,"身份确认",618,20,112,"secondary");DSButton(approval,"退回修改",530,270,104,"secondary");DSButton(approval,"提交审核",648,270,104,"primary")
drawer=DSB(workflow,"Drawer/Detail",20,536,600,300,"#FFFFFF",4,"$border-light");DST(drawer,"Title","Drawer 详情抽屉",18,18,400,15,"$text-primary","600");for(const [i,item] of [["业务编号","LAB-026"],["当前状态","待审核"],["责任角色","质量负责人"],["进入方式","列表行操作"],["返回目标","保留筛选条件"]].entries()){DST(drawer,"Label",item[0],18,64+i*40,110,12,"$text-secondary","600");DST(drawer,"Value",item[1],142,64+i*40,420,13,"$text-regular")}
page=DSB(workflow,"Page/Container",646,536,704,300,"$surface-muted",4,"$border-light");DST(page,"Page Title","Page 页面容器",20,18,360,20,"$text-primary","700");DST(page,"Description","标题、目标、工具栏和稳定内容区",20,52,500,13,"$text-secondary");content=DSB(page,"Content",20,94,664,184,"#FFFFFF",4,"$border-light");DST(content,"Tabs","概览   记录   附件   审计轨迹",18,16,540,13,"$brand-primary","600");Insert(content,{type:"rectangle",name:"Tab Divider",x:18,y:44,width:628,height:1,fill:"$border-light"});Insert(content,{type:"rectangle",name:"Tab Active Line",x:18,y:43,width:52,height:2,fill:"$brand-primary"});DST(content,"Body","Tree · Upload · Descriptions · Chart · Table",18,82,600,16,"$text-regular","600")
Update(ds,{placeholder:false})
`;
}

function pageOperations(pages, componentIds = {}) {
  const specs = JSON.stringify(pages);
  const navigation = JSON.stringify(navigationModel);
  const operations = String.raw`
const specs=${specs}
const navigation=${navigation}
const desktop=specs.filter(s=>!s.id.startsWith("M"));const mobile=specs.filter(s=>s.id.startsWith("M"));
const desktopRows=Math.ceil(desktop.length/4);const mobileRows=Math.ceil(mobile.length/8);
const sheetHeight=mobile.length?440+desktopRows*1020+mobileRows*964-60:desktopRows*1020+380;
sheet=Insert(document,{type:"frame",id:"contactSheet",name:"CNAS LIMS Design Contact Sheet",x:0,y:0,width:6120,height:sheetHeight,fill:"$surface-page",layout:"none",clip:true,placeholder:true})
function Safe(c){return String(c).replaceAll("演示数据","业务数据").replaceAll("演示环境","需求评审环境").replaceAll("全部用户","已认证用户").replaceAll("（演示）","").replaceAll("DEMO","LAB").replaceAll("演示","业务")}
function T(p,n,c,x,y,w,s=14,color="$text-regular",weight="400",align="left"){return Insert(p,{type:"text",name:n,content:Safe(c),x,y,width:w,fontFamily:"$font-cn",fontSize:s,fontWeight:weight,fill:color,letterSpacing:0,textAlign:align,textGrowth:"fixed-width"})}
function Box(p,n,x,y,w,h,fill="$surface-panel",radius=4,stroke="$border-light"){return Insert(p,{type:"frame",name:n,x,y,width:w,height:h,fill,cornerRadius:radius,stroke,strokeWidth:1,layout:"none",clip:true})}
function Ico(p,n,icon,x,y,color="$text-secondary",size=16){return Insert(p,{type:"icon",name:n,library:"lucide",icon,x,y,width:size,height:size,fill:color})}
Insert(sheet,{type:"rectangle",name:"Contact Sheet Header",x:0,y:0,width:6120,height:380,fill:"$surface-page"})
T(sheet,"Contact Sheet Title","CNAS 实验室信息管理系统 · web-ele 页面设计",40,36,1200,28,"$text-primary","700")
T(sheet,"Contact Sheet Subtitle","华衡检测实验室 · Vben Admin 5.x + Element Plus · 需求评审稿",40,82,1200,14,"$text-secondary")
for(const [i,item] of [["主色","$brand-primary"],["辅助蓝","$brand-secondary"],["成功","$semantic-success"],["警告","$semantic-warning"],["危险","$semantic-danger"],["信息","$semantic-info"]].entries()){const b=Box(sheet,"Overview Token/"+item[0],40+i*176,132,160,76,"$surface-panel",6);Insert(b,{type:"rectangle",name:"Swatch",x:12,y:12,width:40,height:40,fill:item[1],cornerRadius:4});T(b,"Label",item[0],64,21,80,13,"$text-primary","600")}
const note=Box(sheet,"Overview Note",40,244,1120,86,"#FFFFFF",6,"$border-light");T(note,"Title","页面覆盖与状态约束",18,14,260,15,"$text-primary","600");T(note,"Content","关键操作呈现权限、异常、审计和受控状态；页面数据均为非生产样例。",18,46,1040,13,"$text-regular")
function Tag(p,label,x,y,tone="info"){const clean=Safe(label);if(!clean)return null;const map={success:["#F0F9EB","$semantic-success","cmpTagSuccess","cmpTagSuccessLabel"],warning:["#FDF6EC","$semantic-warning","cmpTagWarning","cmpTagWarningLabel"],danger:["#FEF0F0","$semantic-danger","cmpTagDanger","cmpTagDangerLabel"],info:["#F4F4F5","$semantic-info","cmpTagInfo","cmpTagInfoLabel"],brand:["#E6FFFA","$brand-primary","cmpTagInfo","cmpTagInfoLabel"]};const m=map[tone];const w=Math.max(56,clean.length*14+16);const b=Insert(p,{type:"ref",name:"Tag Instance/"+clean,ref:m[2],x,y,width:w,height:26});Update(b,{fill:m[0],stroke:m[1]});Update(b+"/"+m[3],{content:clean,width:w-16,fill:m[1]});return b}
function Button(p,label,x,y,primary=false,w=96){const variant=primary==="danger"?"danger":primary?"primary":"secondary";const refs={primary:["cmpButtonPrimary","cmpButtonPrimaryLabel","#FFFFFF"],secondary:["cmpButtonSecondary","cmpButtonSecondaryLabel","$text-regular"],danger:["cmpButtonDanger","cmpButtonDangerLabel","#FFFFFF"]}[variant];const b=Insert(p,{type:"ref",name:"Button Instance/"+label,ref:refs[0],x,y,width:w,height:34});Update(b+"/"+refs[1],{content:Safe(label),x:0,y:0,width:"fill_container",height:"fill_container",fill:refs[2],textAlign:"center",textAlignVertical:"middle",textGrowth:"fixed-width-height"});return b}
function DisabledButton(p,label,x,y,w=140){const b=Box(p,"Disabled Button/"+label,x,y,w,34,"#E5E7EB",4,"#D1D5DB");T(b,"Label",label,0,8,w,13,"$text-secondary","600","center");return b}
function Field(p,label,value,x,y,w=220){T(p,"Field Label/"+label,label,x,y,w,12,"$text-regular","500");const b=Insert(p,{type:"ref",name:"Input Instance/"+label,ref:"cmpFormInput",x,y:y+22,width:w,height:36});Update(b+"/cmpFormInputValue",{content:Safe(value),width:w-24,fill:value.includes("请选择")?"$text-secondary":"$text-primary"});return b}
function WarningAlert(p,message,x,y,w){const h=w<260?76:w<420?60:48;const b=Insert(p,{type:"ref",name:"Alert Warning Instance",ref:"cmpAlertWarning",x,y,width:w,height:h});Update(b+"/cmpAlertWarningMessage",{content:Safe(message),width:w-70});return b}
const BaseBox=Box,BaseT=T;Box=function(p,n,x,y,w,h,...args){if(n==="Mobile Result Record")h=270;return BaseBox(p,n,x,y,w,h,...args)};T=function(p,n,c,x,y,w,...args){if(n==="Sync"&&y===594)y=622;return BaseT(p,n,c,x,y,w,...args)}
function NavModel(s){const rootIndex=navigation.findIndex(item=>item.root===s.root);return {root:Math.max(0,rootIndex),children:navigation[Math.max(0,rootIndex)].children,active:s.menu}}
function Shell(page,s){Insert(page,{type:"rectangle",name:"Sidebar",x:0,y:0,width:216,height:900,fill:"$brand-primary-dark"});T(page,"Brand","CNAS LIMS",24,18,160,20,"#FFFFFF","700");T(page,"Organization","华衡检测实验室",24,46,168,12,"#D6F4EF","400");const menus=navigation.map(item=>item.root),nav=NavModel(s);let menuY=92;for(const [i,m] of menus.entries()){if(i===nav.root)Insert(page,{type:"rectangle",name:"Active Root Menu",x:12,y:menuY,width:192,height:36,fill:"#FFFFFF20",cornerRadius:4});Ico(page,"Root Menu Icon",i===nav.root?"chevron-down":"chevron-right",28,menuY+11,i===nav.root?"#FFFFFF":"#BDE8E1",14);T(page,"Root Menu/"+m,m,52,menuY+8,140,14,"#FFFFFF",i===nav.root?"700":"400");menuY+=40;if(i===nav.root){for(const child of nav.children){if(child===nav.active)Insert(page,{type:"rectangle",name:"Active Submenu",x:28,y:menuY,width:168,height:30,fill:"#0F766E",cornerRadius:4});Insert(page,{type:"rectangle",name:"Submenu Guide",x:38,y:menuY+14,width:8,height:1,fill:child===nav.active?"#FFFFFF":"#8FD4CA"});T(page,"Submenu/"+child,child,54,menuY+7,136,13,child===nav.active?"#FFFFFF":"#D6F4EF",child===nav.active?"600":"400");menuY+=34}}menuY+=4}
Insert(page,{type:"rectangle",name:"Topbar",x:216,y:0,width:1224,height:56,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});Ico(page,"Search","search",240,20,"$text-secondary",16);T(page,"Global Search","搜索样品、任务、报告、文件",266,18,300,14,"$text-secondary");Ico(page,"Notifications","bell",1270,20,"$text-secondary",16);Ico(page,"User","circle-user-round",1324,18,"$brand-primary",20);T(page,"User Name","当前用户",1350,18,66,13,"$text-regular","500","right");Insert(page,{type:"rectangle",name:"Tabs",x:216,y:56,width:1224,height:36,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});T(page,"Tab",s.root+"  /  "+s.menu+(s.pageType==="操作页"?"  /  "+s.title:""),240,67,900,12,"$text-secondary")}
function Header(page,s){T(page,"Page Title",s.title,240,116,620,24,"$text-primary","700");T(page,"Page Goal",s.goal,240,150,900,13,"$text-secondary")}
function AppShell(page,s){
  Insert(page,{type:"rectangle",name:"Sidebar",x:0,y:0,width:216,height:900,fill:"$brand-primary-dark"});
  T(page,"Brand","CNAS LIMS",24,16,160,20,"#FFFFFF","700");T(page,"Organization","华衡检测实验室",24,43,168,12,"#D6F4EF","400");
  const menus=navigation.map(item=>item.root),nav=NavModel(s);let menuY=76;
  for(const [i,m] of menus.entries()){
    if(i===nav.root)Insert(page,{type:"rectangle",name:"Active Root Menu",x:12,y:menuY,width:192,height:30,fill:"#FFFFFF20",cornerRadius:4});
    Ico(page,"Root Menu Icon",i===nav.root?"chevron-down":"chevron-right",28,menuY+8,i===nav.root?"#FFFFFF":"#BDE8E1",14);
    T(page,"Root Menu/"+m,m,52,menuY+5,140,14,"#FFFFFF",i===nav.root?"700":"400");menuY+=32;
    if(i===nav.root){for(const child of nav.children){
      if(child===nav.active)Insert(page,{type:"rectangle",name:"Active Submenu",x:28,y:menuY,width:168,height:24,fill:"#0F766E",cornerRadius:4});
      Insert(page,{type:"rectangle",name:"Submenu Guide",x:38,y:menuY+11,width:8,height:1,fill:child===nav.active?"#FFFFFF":"#8FD4CA"});
      T(page,"Submenu/"+child,child,54,menuY+4,136,12,child===nav.active?"#FFFFFF":"#D6F4EF",child===nav.active?"600":"400");menuY+=27;
    }}menuY+=2;
  }
  Insert(page,{type:"rectangle",name:"Topbar",x:216,y:0,width:1224,height:56,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});
  Ico(page,"Search","search",240,20,"$text-secondary",16);T(page,"Global Search","搜索样品、任务、报告、文件",266,18,300,14,"$text-secondary");
  Ico(page,"Notifications","bell",1270,20,"$text-secondary",16);Ico(page,"User","circle-user-round",1324,18,"$brand-primary",20);T(page,"User Name","当前用户",1350,18,66,13,"$text-regular","500","right");
  Insert(page,{type:"rectangle",name:"Tabs",x:216,y:56,width:1224,height:36,fill:"$surface-panel",stroke:"$border-light",strokeWidth:{bottom:1}});
  T(page,"Tab",s.root+"  /  "+s.menu+(s.pageType==="操作页"?"  /  "+s.title:""),240,67,900,12,"$text-secondary");
}
function Filters(page,s){const f=Box(page,"VbenForm Filters",240,186,1176,82,"$surface-panel",6,"$border-light");for(let i=0;i<3;i++)Field(f,s.fields[i]||"筛选条件",i===0?"请输入关键字":"请选择",18+i*260,12,238);Button(f,"查询",820,35,true,84);Button(f,"重置",914,35,false,84);Button(f,"更多筛选",1008,35,false,116)}
function Table(page,s,y=324,h=444){const panel=Box(page,"VxeTable",240,y,1176,h,"$surface-panel",6,"$border-light");T(panel,"Panel Title",s.title+"列表",18,16,300,16,"$text-primary","600");Button(panel,"新增",950,12,true,84);Button(panel,"导出",1044,12,false,84);Insert(panel,{type:"ref",name:"Table Header Instance",ref:"cmpTableHeader",x:0,y:56,width:1176,height:40});for(let r=0;r<5;r++){const row=Insert(panel,{type:"ref",name:"Table Row Instance "+(r+1),ref:"cmpTableRow",x:0,y:96+r*48,width:1176,height:44});if(r%2)Update(row,{fill:"#FAFCFC"})}
T(panel,"Pagination","共 58 条   20 条/页    1  2  3  下一页",820,h-36,330,12,"$text-secondary","400","right")}
function CompactTable(p,x,y,w,rows=3){const table=Box(p,"Compact Business Table",x,y,w,42+rows*44,"#FFFFFF",4,"$border-light");Insert(table,{type:"rectangle",name:"Compact Header",x:0,y:0,width:w,height:40,fill:"#F5F7FA"});for(const [i,l] of ["编号","对象","结果","状态"].entries())T(table,"Header",l,12+i*w/4,12,w/4-20,12,"$text-regular","600");for(let r=0;r<rows;r++){Insert(table,{type:"rectangle",name:"Compact Row",x:0,y:40+r*44,width:w,height:44,fill:r%2?"#FAFCFC":"#FFFFFF",stroke:"$border-light",strokeWidth:{bottom:1}});for(const [i,v] of ["DEMO-0"+(r+1),"演示对象",r===1?"待复核":"已记录",r===2?"差异":"正常"].entries())T(table,"Cell",v,12+i*w/4,54+r*44,w/4-20,12,i===3&&r===2?"$semantic-danger":"$text-regular",i===3?"600":"400")};return table}
function Timeline(panel,x,y){T(panel,"Timeline Title","流程与审计留痕",x,y,240,15,"$text-primary","600");for(const [i,e] of ["提交申请 · 10:12","审核通过 · 11:05","等待下一节点 · 当前"].entries()){Insert(panel,{type:"ellipse",name:"Timeline Dot",x:x+4,y:y+36+i*58,width:10,height:10,fill:i===2?"$semantic-warning":"$brand-primary"});if(i<2)Insert(panel,{type:"rectangle",name:"Timeline Line",x:x+8,y:y+46+i*58,width:2,height:48,fill:"$border-base"});T(panel,"Timeline Event",e,x+28,y+31+i*58,250,13,i===2?"$semantic-warning":"$text-regular",i===2?"600":"400")}}
function Steps(panel,labels,y=22,gap=210){for(const [i,l] of labels.entries()){const x=34+i*gap;Insert(panel,{type:"ellipse",name:"Step "+(i+1),x,y,width:28,height:28,fill:i<2?"$brand-primary":"#E5E7EB"});T(panel,"Step Number",String(i+1),x,y+5,28,12,i<2?"#FFFFFF":"$text-secondary","700","center");T(panel,"Step Label",l,x+38,y+5,gap-52,13,i<2?"$text-primary":"$text-secondary",i===1?"600":"400");if(i<labels.length-1)Insert(panel,{type:"rectangle",name:"Step Line",x:x+gap-50,y:y+13,width:38,height:2,fill:i<1?"$brand-primary":"$border-base"})}}
function Dashboard(page,s){const vals=[["待处理任务","18","-3 较昨日","brand"],["样品按期率","96.8%","+1.2%","success"],["质量风险","4","2 项高风险","danger"],["资源预警","7","3 项临期","warning"]];for(const [i,v] of vals.entries()){const b=Box(page,"Statistic/"+v[0],240+i*282,190,264,116,"$surface-panel",6);T(b,"Label",v[0],18,18,160,13,"$text-secondary");T(b,"Value",v[1],18,48,150,30,"$text-primary","700");Tag(b,v[2],150,60,v[3])}const chart=Box(page,"Trend Chart",240,326,744,400,"$surface-panel",6);T(chart,"Title","任务与样品趋势",18,18,300,16,"$text-primary","600");for(let i=0;i<7;i++){const h=80+i%3*24;Insert(chart,{type:"rectangle",name:"Bar",x:46+i*88,y:300-h,width:28,height:h,fill:i===6?"$brand-primary":"#99D5CF",cornerRadius:[4,4,0,0]});T(chart,"Day",String(i+21)+"日",34+i*88,316,52,11,"$text-secondary","400","center")}const side=Box(page,"Risk Queue",1004,326,412,400,"$surface-panel",6);T(side,"Title","重点风险与待办",18,18,260,16,"$text-primary","600");for(const [i,e] of ["报告签发授权即将到期","环境监测点连续偏高","设备校准证书待复核","内审整改剩余 2 天","库存批次进入临期"].entries()){Tag(side,i<2?"高":"关注",18,58+i*58,i<2?"danger":"warning");T(side,"Risk",e,84,61+i*58,285,13,"$text-regular",i<2?"600":"400")}}
function Form(page,s,mode="form"){const panel=Box(page,"Controlled Form",240,188,1176,580,"$surface-panel",6);Steps(panel,["基本信息","业务内容","复核确认","完成"]);if(mode==="review"||mode==="approval"||mode==="version"){const main=Box(panel,"Review Main",20,78,740,430,"#FFFFFF",4,"$border-light");T(main,"Title",mode==="version"?"版本内容对比":"业务核验清单",18,16,300,16,"$text-primary","600");for(let i=0;i<6;i++){const label=s.fields[i%s.fields.length];Insert(main,{type:"rectangle",name:"Checklist",x:18,y:58+i*52,width:18,height:18,fill:i<4?"$brand-primary":"#FFFFFF",stroke:i<4?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(main,"Check Label",label+"："+(i<4?"已核验":"需要补充"),48,58+i*52,650,13,i<4?"$text-regular":"$semantic-warning",i<4?"400":"600")}const side=Box(panel,"Approval Side",780,78,376,430,"#FAFCFC",4,"$border-light");Timeline(side,20,20);Insert(side,{type:"rectangle",name:"Divider",x:20,y:225,width:336,height:1,fill:"$border-base"});T(side,"Opinion Label","审批意见",20,246,120,13,"$text-regular","600");const op=Box(side,"Opinion",20,272,336,72,"$surface-panel",4,"$border-base");T(op,"Placeholder","请填写明确的审核意见",12,12,310,13,"$text-secondary");Button(side,"退回修改",144,366,false,96);Button(side,mode==="approval"?"签名并发布":"提交审核",246,366,true,108)}else{for(let i=0;i<6;i++){const col=i%2,row=Math.floor(i/2);Field(panel,s.fields[i%s.fields.length],i===0?"DEMO-260727-01":i===1?"华衡检测演示记录":"请选择",30+col*552,94+row*92,520)}const detail=Box(panel,"Dynamic Items",30,382,1076,110,"#FAFCFC",4,"$border-light");T(detail,"Title","明细项目",16,14,180,14,"$text-primary","600");T(detail,"Rows","项目 01    演示检测参数    方法版本 V2    数量 3    交付 5 个工作日",16,48,980,13);Button(panel,"保存草稿",884,520,false,106);Button(panel,"提交",1000,520,true,106)}}
function Receive(page,s){const scanner=Box(page,"Sample Receive Scanner",240,188,312,580,"$surface-panel",6);T(scanner,"Title","扫码接收",18,18,180,16,"$text-primary","600");const scan=Box(scanner,"Scan Area",18,56,276,126,"#F0F5F4",6,"$brand-primary");Ico(scan,"Scan Icon","scan-line",112,24,"$brand-primary",46);T(scan,"Hint","扫描样品或委托条码",30,82,216,13,"$text-regular","600","center");Field(scanner,"手工编号","DEMO-S-260727",18,208,276);WarningAlert(scanner,"打印机离线时保留接收结果，可稍后补打标签。",18,304,276);Button(scanner,"查询",110,382,true,84);const main=Box(page,"Sample Receive Checklist",572,188,524,580,"$surface-panel",6);T(main,"Title","委托与接收核对",18,18,260,16,"$text-primary","600");Tag(main,"待核对",424,16,"warning");for(const [i,l] of ["数量与委托一致","包装和容器完好","温度条件符合","标识清晰可追溯","异常已由客户确认"].entries()){Insert(main,{type:"rectangle",name:"Receive Check",x:18,y:62+i*48,width:18,height:18,fill:i<4?"$brand-primary":"#FFFFFF",stroke:i<4?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(main,"Check Label",l,48,62+i*48,410,13,"$text-regular",i===4?"600":"400")}CompactTable(main,18,318,488,2);Button(main,"确认接收",382,516,true,112);const label=Box(page,"Sample Label Preview",1116,188,300,580,"$surface-panel",6);T(label,"Title","标签与库位",18,18,180,16,"$text-primary","600");const preview=Box(label,"Label Preview",18,58,264,170,"#FFFFFF",4,"$border-base");T(preview,"Code","DEMO-S-260727-01",16,18,220,18,"$text-primary","700");Ico(preview,"QR","qr-code",84,56,"$text-primary",96);T(preview,"Meta","2-8℃ · 冷藏库 A-03",16,146,220,12,"$text-secondary","400","center");Field(label,"目标库位","冷藏库 A-03",18,258,264);T(label,"Audit","接收人：陈样品（演示）\n接收时间：2026-07-27 10:26\n标签批次：LBL-DEMO-07",18,358,250,13,"$text-regular");Button(label,"打印标签",166,516,false,116)}
function Schedule(page,s){const calendar=Box(page,"Resource Scheduling Board",240,188,816,580,"$surface-panel",6);T(calendar,"Title","资源排程与任务泳道",18,18,300,16,"$text-primary","600");for(const [i,d] of ["08:00","10:00","12:00","14:00","16:00"].entries())T(calendar,"Time",d,150+i*126,58,62,11,"$text-secondary","400","center");for(const [r,l] of ["林检测员","周复核员","设备 EQ-07","环境室 A"].entries()){T(calendar,"Lane",l,18,104+r*92,118,13,"$text-regular","600");Insert(calendar,{type:"rectangle",name:"Lane Line",x:142,y:98+r*92,width:648,height:1,fill:"$border-light"});const start=174+r*96;Insert(calendar,{type:"rectangle",name:"Task Bar",x:start,y:92+r*92,width:r===2?240:188,height:42,fill:r===2?"#FEF0F0":"#D9F1EE",stroke:r===2?"$semantic-danger":"$brand-primary",strokeWidth:1,cornerRadius:4});T(calendar,"Task",r===2?"设备占用冲突":"DEMO-TASK-0"+(r+1),start+12,105+r*92,r===2?210:164,12,r===2?"$semantic-danger":"$brand-primary","600")};Button(calendar,"批量分配",670,522,true,116);const side=Box(page,"Scheduling Conflicts",1076,188,340,580,"$surface-panel",6);T(side,"Title","冲突与阻断",18,18,220,16,"$text-primary","600");WarningAlert(side,"授权到期或设备时段重叠时禁止分配。",18,54,304);for(const [i,e] of ["设备 EQ-07 10:00-12:00 已占用","林检测员授权 3 天后到期","环境室 A 当前可用"].entries()){Tag(side,i===2?"可用":i===0?"阻断":"关注",18,132+i*76,i===2?"success":i===0?"danger":"warning");T(side,"Conflict",e,88,136+i*76,228,13,"$text-regular",i===0?"600":"400")};T(side,"Rule","冲突分配按钮保持禁用；解除后记录人员、设备和计划时间。",18,384,290,13,"$text-regular");DisabledButton(side,"冲突未解除",182,520,140)}
function RecordEditor(page,s){const left=Box(page,"Raw Record Context",240,188,250,580,"$surface-panel",6);T(left,"Title","任务与样品",18,18,180,16,"$text-primary","600");for(const [i,e] of ["任务 DEMO-T-017","样品 DEMO-S-031","项目 演示参数 A","方法 DEMO-M-V2"].entries())T(left,"Context",e,18,64+i*44,210,13,"$text-regular",i===0?"600":"400");WarningAlert(left,"设备校准失效时原始值录入被阻断。",18,260,214);Tag(left,"草稿 · 自动保存",18,338,"info");T(left,"Audit","更正需填写理由，保留前后值、操作者和时间。",18,390,210,13,"$text-regular");const grid=Box(page,"Raw Record Grid",510,188,616,580,"$surface-panel",6);T(grid,"Title","原始记录与自动计算",18,18,300,16,"$text-primary","600");CompactTable(grid,0,58,616,5);T(grid,"Formula","公式版本：CALC-DEMO-V2    计算值：12.68    判定：符合",18,372,560,13,"$text-primary","600");Field(grid,"更正理由","仅在更正时必填",18,410,580);Button(grid,"保存草稿",382,522,false,96);Button(grid,"提交复核",488,522,true,110);const right=Box(page,"Raw Record Resources",1146,188,270,580,"$surface-panel",6);T(right,"Title","资源与状态",18,18,180,16,"$text-primary","600");for(const [i,e] of [["方法版本","有效"],["设备 EQ-07","有效"],["环境 22.4℃","正常"],["物料 LOT-07","可用"]].entries()){T(right,"Resource",e[0],18,66+i*62,150,13,"$text-regular");Tag(right,e[1],176,60+i*62,i===0?"info":"success")};WarningAlert(right,"超范围输入需复核，归档后字段只读。",18,340,234);T(right,"Autosave","最近保存：10:32:18\n同步状态：已同步",18,430,220,13,"$text-secondary")}
function ImportData(page,s){const upload=Box(page,"Instrument Upload Queue",240,188,300,580,"$surface-panel",6);T(upload,"Title","仪器文件与映射",18,18,220,16,"$text-primary","600");const drop=Box(upload,"Upload Dropzone",18,58,264,120,"#F0F5F4",6,"$brand-secondary");Ico(drop,"Upload","upload-cloud",112,22,"$brand-secondary",40);T(drop,"Hint","拖入 CSV / 仪器文件",32,74,200,13,"$text-regular","600","center");Field(upload,"目标仪器","EQ-DEMO-07",18,204,264);Field(upload,"字段映射","样品号 → specimen_id",18,290,264);Tag(upload,"待对账",18,394,"warning");Button(upload,"开始解析",166,520,true,116);const reconcile=Box(page,"Import Reconciliation",560,188,548,580,"$surface-panel",6);T(reconcile,"Title","结果导入与对账",18,18,260,16,"$text-primary","600");CompactTable(reconcile,0,58,548,6);T(reconcile,"Summary","匹配 18 · 差异 3 · 重复 1 · 未识别 1",18,408,480,14,"$text-primary","600");Button(reconcile,"确认导入",412,520,true,116);const diff=Box(page,"Import Differences",1128,188,288,580,"$surface-panel",6);T(diff,"Title","差异与人工确认",18,18,220,16,"$text-primary","600");for(const [i,e] of [["重复数据","样品 017"],["单位不匹配","mg/L → μg/L"],["未识别样品","TEMP-009"]].entries()){Tag(diff,e[0],18,62+i*88,i===0?"danger":"warning");T(diff,"Diff",e[1],18,96+i*88,240,13,"$text-regular","600")};WarningAlert(diff,"人工确认必须记录确认人、处理结果和时间。",18,342,252);T(diff,"Audit","确认人：周复核（演示）\n处理：等待补充映射\n状态：已阻断导入",18,430,246,13,"$text-regular")}
function ReportEditor(page,s){const form=Box(page,"Report Composition",240,188,520,580,"$surface-panel",6);T(form,"Title","报告编制",18,18,220,16,"$text-primary","600");Tag(form,"模板 V2",412,16,"info");Field(form,"报告编号","DEMO-RPT-260727",18,62,484);Field(form,"判定结论","符合演示判定规则",18,148,484);Field(form,"声明与备注","请选择",18,234,484);T(form,"Readonly","客户、样品、方法和原始结果由系统自动带入，只读且可追溯。",18,326,470,13,"$text-secondary");WarningAlert(form,"认可标识不适用或结果缺项时禁止提交。",18,370,484);Button(form,"保存草稿",292,522,false,96);Button(form,"提交审核",398,522,true,104);const preview=Box(page,"Report Preview",780,188,636,580,"$surface-panel",6);T(preview,"Title","A4 实时预览",18,18,220,16,"$text-primary","600");const pages=Box(preview,"Page Thumbnails",18,58,96,468,"#FAFCFC",4);for(let i=0;i<3;i++){const thumb=Box(pages,"Page "+(i+1),14,18+i*142,68,112,"#FFFFFF",2,"$border-base");T(thumb,"No",String(i+1),26,46,16,12,"$text-secondary","600","center")};const paper=Box(preview,"A4 Paper",132,58,340,468,"#FFFFFF",4,"$border-base");T(paper,"Report Title","检 测 报 告（演示）",38,30,264,20,"$text-primary","700","center");T(paper,"Meta","报告编号：DEMO-RPT-260727\n客户：华衡演示客户\n样品：DEMO-S-031",28,86,284,12,"$text-regular");Insert(paper,{type:"rectangle",name:"Result Divider",x:28,y:166,width:284,height:1,fill:"$border-base"});T(paper,"Results","检测项目       结果       单位       判定\n演示参数 A     12.68      mg/L       符合\n演示参数 B     8.42       mg/L       符合",28,190,284,12,"$text-regular");T(paper,"Signature","审核：________    批准：________",28,410,284,12,"$text-secondary");const loading=Insert(preview,{type:"ref",name:"Template Loading Skeleton",ref:"cmpStateSkeleton",x:318,y:58,width:300,height:128});Update(loading,{opacity:0.7});T(preview,"Loading Label","模板加载状态",404,198,130,12,"$text-secondary","400","center")}
function TrainingSchedule(page,s){const calendar=Box(page,"Training Calendar",240,188,700,580,"$surface-panel",6);T(calendar,"Title","培训计划月历",18,18,220,16,"$text-primary","600");for(const [i,d] of ["周一","周二","周三","周四","周五"].entries())T(calendar,"Week",d,24+i*132,58,100,12,"$text-secondary","600","center");for(let r=0;r<4;r++)for(let c=0;c<5;c++){const cell=Box(calendar,"Calendar Cell",18+c*132,84+r*104,124,94,r===1&&c===2?"#E6FFFA":"#FAFCFC",4,"$border-light");T(cell,"Day",String(r*5+c+1),10,8,30,12,"$text-secondary");if((r+c)%3===0)Tag(cell,"培训",10,40,"brand")};const side=Box(page,"Training Execution",960,188,456,580,"$surface-panel",6);T(side,"Title","执行、考核与评价",18,18,260,16,"$text-primary","600");WarningAlert(side,"讲师资格未确认，发布计划保持禁用。",18,54,420);for(const [i,e] of [["参训人数","18"],["签到率","88%"],["考核通过","14"],["待评价","4"]].entries()){T(side,"Metric",e[0],18+(i%2)*204,136+Math.floor(i/2)*76,110,12,"$text-secondary");T(side,"Value",e[1],18+(i%2)*204,160+Math.floor(i/2)*76,110,22,"$text-primary","700")};const modal=Box(side,"Assessment Modal",18,302,420,164,"#FAFCFC",4,"$border-base");T(modal,"Title","考核结果加载状态",16,14,220,14,"$text-primary","600");Insert(modal,{type:"ref",name:"Training Assessment Skeleton",ref:"cmpStateSkeleton",x:60,y:30,width:300,height:128});DisabledButton(side,"发布计划（禁用）",270,520,168)}
function EquipmentSchedule(page,s){const calendar=Box(page,"Equipment Plan Calendar",240,188,796,580,"$surface-panel",6);T(calendar,"Title","校准 / 检定 / 维护 / 期间核查",18,18,360,16,"$text-primary","600");for(const [i,l] of ["校准","检定","维护","期间核查"].entries())Tag(calendar,l,18+i*96,54,["brand","success","warning","info"][i]);for(let r=0;r<4;r++)for(let c=0;c<6;c++){const cell=Box(calendar,"Plan Day",18+c*126,98+r*96,118,86,"#FAFCFC",4,"$border-light");T(cell,"Day",String(r*6+c+1),10,8,28,12,"$text-secondary");if((r+c)%4===0){Tag(cell,"EQ-0"+(c+1),10,38,r===2?"danger":"warning")}}Button(calendar,"批量建计划",646,522,true,128);const side=Box(page,"Equipment Plan Conflicts",1056,188,360,580,"$surface-panel",6);T(side,"Title","临期与冲突",18,18,220,16,"$text-primary","600");WarningAlert(side,"3 台设备计划临期，请确认责任人和服务窗口。",18,54,324);for(const [i,e] of ["EQ-07 校准剩余 7 天","EQ-03 维护人员时段冲突","EQ-11 期间核查待确认"].entries()){Tag(side,i===1?"冲突":"临期",18,132+i*76,i===1?"danger":"warning");T(side,"Plan",e,86,136+i*76,244,13,"$text-regular","600")};T(side,"Help","冲突提供调整入口；完成确认记录计划类型、完成日期和责任人。",18,378,318,13,"$text-regular");Button(side,"调整计划",226,520,true,116)}
function MatrixView(page,s){const isAcc=s.id==="G07",isEvidence=s.id==="G08";const left=Box(page,isAcc?"Accreditation Scope Tree":isEvidence?"Requirement Evidence Tree":"Authorization Scope Tree",240,188,256,580,"$surface-panel",6);T(left,"Title",isAcc?"认可范围树":isEvidence?"适用要求树":"授权范围树",18,18,190,16,"$text-primary","600");for(const [i,l] of (isAcc?["场所 A","  对象类别","    项目/参数","      方法版本"]:isEvidence?["管理要求","  组织与职责","  文件和记录","技术要求","  人员与设备"]:["检测项目","方法标准","仪器设备","授权场所"]).entries())T(left,"Tree Node","▸ "+l,18,64+i*48,210,13,i===2?"$brand-primary":"$text-regular",i===2?"600":"400");if(isEvidence)Insert(left,{type:"ref",name:"Evidence Empty State",ref:"cmpStateEmpty",x:18,y:352,width:220,height:128});const main=Box(page,isAcc?"Accreditation Scope Matrix":isEvidence?"Evidence Compliance Matrix":"Personnel Authorization Matrix",516,188,644,580,"$surface-panel",6);T(main,"Title",isAcc?"范围与授权签字人矩阵":isEvidence?"条款自查与证据矩阵":"人员能力授权矩阵",18,18,320,16,"$text-primary","600");for(const [i,l] of ["有效","临期","暂停","未授权"].entries())Tag(main,l,18+i*82,54,["success","warning","danger","info"][i]);const headers=isEvidence?["要求项","责任人","符合性","证据"]:isAcc?["人员","领域","场所","方法"]:["人员","项目","方法","设备"];for(const [i,h] of headers.entries())T(main,"Matrix Header",h,24+i*148,108,120,12,"$text-regular","600","center");for(let r=0;r<5;r++){T(main,"Matrix Row",isEvidence?"要求 "+(r+1):"演示人员 "+(r+1),18,148+r*58,122,12,"$text-regular");for(let c=1;c<4;c++){const tone=(r+c)%4;Insert(main,{type:"rectangle",name:"Matrix Cell",x:172+(c-1)*148,y:142+r*58,width:22,height:22,fill:tone===0?"$semantic-danger":tone===1?"$brand-primary":tone===2?"$semantic-warning":"#FFFFFF",stroke:tone===3?"$border-base":"#FFFFFF",strokeWidth:1,cornerRadius:4})}}Button(main,isEvidence?"转内部审核":"变更授权",488,522,true,128);const side=Box(page,"Matrix Detail Drawer",1180,188,236,580,"$surface-panel",6);T(side,"Title","选中项详情",18,18,180,16,"$text-primary","600");T(side,"Detail",isEvidence?"证据数量：0\n缺口：责任证明\n符合性：待评价":"当前角色："+s.role+"\n范围：演示范围\n有效期：2026-12-31",18,64,198,13,"$text-regular");WarningAlert(side,isAcc?"授权与认可范围不匹配，不能签发。":isEvidence?"证据缺口可转入内部审核。":"暂停或撤权必须填写原因并记录影响任务。",18,172,200);Field(side,"变更原因","请选择",18,272,200);T(side,"Audit","操作、原因、影响范围和时间均记录审计。",18,378,198,13,"$text-secondary");if(isAcc)DisabledButton(side,"不能签发",92,520,126);else Button(side,isEvidence?"查看证据":"确认变更",92,520,true,126)}
function AuditExecution(page,s){const plan=Box(page,"Internal Audit Plan",240,188,300,580,"$surface-panel",6);T(plan,"Title","审核计划与审核组",18,18,230,16,"$text-primary","600");Field(plan,"审核范围","检测一组 / 资源管理",18,62,264);Field(plan,"主审员","林内审（演示）",18,148,264);const independence=Box(plan,"Audit Independence Alert",18,242,264,104,"#FDF6EC",4,"$semantic-warning");T(independence,"Title","职责分离检查",14,12,210,13,"#7A4C00","600");T(independence,"Message","内审员审核本人负责工作，必须阻断分配。",14,42,232,13,"#7A4C00");Tag(plan,"分配已阻断",18,374,"danger");Button(plan,"调整审核组",156,520,true,126);const checklist=Box(page,"Audit Checklist and Evidence",560,188,596,580,"$surface-panel",6);T(checklist,"Title","检查表执行与证据",18,18,260,16,"$text-primary","600");for(const [i,e] of ["职责文件已受控","人员授权证据完整","设备记录可追溯","整改措施已验证","现场证据待上传"].entries()){Insert(checklist,{type:"rectangle",name:"Audit Check",x:18,y:62+i*56,width:18,height:18,fill:i<3?"$brand-primary":"#FFFFFF",stroke:i<3?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(checklist,"Item",e,48,62+i*56,390,13,"$text-regular");Tag(checklist,i<3?"符合":i===3?"观察":"缺证据",470,58+i*56,i<3?"success":"warning")};const upload=Box(checklist,"Evidence Upload",18,358,560,96,"#FAFCFC",4,"$border-base");Ico(upload,"Upload","upload-cloud",18,26,"$brand-secondary",30);T(upload,"Hint","上传检查证据；失败时保留队列并支持重试",64,30,420,13,"$text-regular","600");Button(checklist,"保存检查表",438,520,true,140);const status=Box(page,"Audit Progress and Conclusion",1176,188,240,580,"$surface-panel",6);T(status,"Title","进度与结论",18,18,180,16,"$text-primary","600");T(status,"Progress","检查项 12/18\n证据 9\n不符合 2\n观察项 1",18,68,180,14,"$text-primary","600");Tag(status,"执行中",18,178,"brand");WarningAlert(status,"证据不足，暂不能完成审核。",18,228,204);T(status,"Audit State","范围调整、上传失败与重试均保留时间线。",18,330,198,13,"$text-regular");Button(status,"形成结论",94,520,false,128)}
function AuditLogView(page,s){Filters(page,s);const log=Box(page,"Readonly Audit Log",240,286,760,462,"$surface-panel",6);T(log,"Title","只读审计日志",18,18,260,16,"$text-primary","600");Tag(log,"不可编辑",620,16,"danger");CompactTable(log,0,56,760,6);T(log,"Mask","敏感值已掩码：证件号 ******2718",18,404,360,12,"$text-secondary");const side=Box(page,"Audit Before After Drawer",1020,286,396,462,"$surface-panel",6);T(side,"Title","操作前后值对比",18,18,240,16,"$text-primary","600");T(side,"Meta","主体：林审核（演示）\n对象：DEMO-RPT-017\n动作：报告字段更正\n来源：Web\n理由：客户确认更正",18,62,340,13,"$text-regular");const before=Box(side,"Before",18,194,168,112,"#FEF0F0",4);T(before,"Label","变更前",12,12,120,12,"$semantic-danger","600");T(before,"Value","结果：12.86\n状态：待签发",12,42,140,13,"$text-regular");const after=Box(side,"After",206,194,168,112,"#F0F9EB",4);T(after,"Label","变更后",12,12,120,12,"$semantic-success","600");T(after,"Value","结果：12.68\n状态：重新审核",12,42,140,13,"$text-regular");WarningAlert(side,"非审计角色禁止导出；导出行为本身也记录留痕。",18,330,356);Button(side,"申请导出权限",238,412,false,138)}
function Monitor(page,s){const vals=[[s.fields[0]||"在线对象","24","正常"],[s.fields[1]||"待处理","7","关注"],[s.fields[2]||"异常项","2","高风险"]];for(const [i,v] of vals.entries()){const b=Box(page,"Metric "+v[0],240+i*282,190,264,104,"$surface-panel",6);T(b,"Label",v[0],18,16,180,13,"$text-secondary");T(b,"Value",v[1],18,44,100,28,"$text-primary","700");Tag(b,v[2],150,52,i===2?"danger":i===1?"warning":"success")}const graph=Box(page,"Monitoring Trend",240,314,760,420,"$surface-panel",6);T(graph,"Title",s.title+"趋势",18,18,300,16,"$text-primary","600");for(let i=0;i<9;i++){const y=120+(i%4)*40;Insert(graph,{type:"ellipse",name:"Trend Point",x:50+i*72,y,width:10,height:10,fill:i===7?"$semantic-danger":"$brand-secondary"});if(i<8)Insert(graph,{type:"rectangle",name:"Trend Segment",x:58+i*72,y:y+4,width:66,height:2,fill:"#93B4E8"})}T(graph,"Threshold","--- 预警阈值",520,70,180,12,"$semantic-warning");const alarms=Box(page,"Alarm Queue",1020,190,396,544,"$surface-panel",6);T(alarms,"Title","异常与预警",18,18,220,16,"$text-primary","600");for(const [i,e] of ["接口同步失败，等待重试","临期对象剩余 7 天","阈值连续超限 12 分钟","人工重放等待审批","恢复成功并完成审计"].entries()){Tag(alarms,i===2?"阻断":i===4?"恢复":"关注",18,58+i*76,i===2?"danger":i===4?"success":"warning");T(alarms,"Alarm",e,88,61+i*76,278,13,"$text-regular",i===2?"600":"400");T(alarms,"Time","2026-07-27 "+(10+i)+":2"+i,88,84+i*76,250,11,"$text-secondary")}}
function Detail(page,s){const main=Box(page,"Detail Main",240,190,760,544,"$surface-panel",6);T(main,"Title",s.title+"详情",18,18,320,16,"$text-primary","600");for(let i=0;i<6;i++){T(main,"Label",s.fields[i%s.fields.length],18+(i%2)*360,64+Math.floor(i/2)*72,130,12,"$text-secondary");T(main,"Value",i===0?"DEMO-260727-01":i===1?"华衡检测演示对象":"已记录并可追溯",18+(i%2)*360,86+Math.floor(i/2)*72,320,14,"$text-primary","500")}const steps=Box(main,"Process Steps",18,292,724,196,"#FAFCFC",4);Steps(steps,["创建","执行","复核","关闭"],24,170);T(steps,"Audit Title","最近留痕",28,82,120,13,"$text-primary","600");for(const [i,e] of ["10:12 提交申请 · 林审核","11:05 完成复核 · 周复核","当前 等待下一节点"].entries()){Tag(steps,i===2?"当前":"完成",28,110+i*24,i===2?"warning":"success");T(steps,"Audit Event",e,94,112+i*24,500,12,i===2?"$semantic-warning":"$text-regular",i===2?"600":"400")}const side=Box(page,"Related Information",1020,190,396,544,"$surface-panel",6);Timeline(side,22,22);T(side,"Audit Note","所有关键操作记录操作者、时间、前后值和理由。",22,250,350,13,"$text-regular");Tag(side,"审计已开启",22,304,"success");Button(side,"查看审计日志",230,470,false,138)}
function Exception(page,s){const alert=Box(page,"Blocking Alert",240,188,1176,58,"#FEF0F0",4,"$semantic-danger");Ico(alert,"Alert Icon","octagon-alert",18,18,"$semantic-danger",22);T(alert,"Alert Message","检测到高风险异常，相关业务已阻断；完成影响评价和审批后方可继续。",54,18,900,14,"$semantic-danger","600");Tag(alert,"已阻断",1034,16,"danger");const main=Box(page,"Exception Form",240,266,760,468,"$surface-panel",6);for(let i=0;i<4;i++)Field(main,s.fields[i%s.fields.length],i===0?"偏离/异常":"已记录",22+(i%2)*360,22+Math.floor(i/2)*86,332);T(main,"Impact Title","影响评价",22,206,160,14,"$text-primary","600");const impact=Box(main,"Impact",22,232,716,112,"#FAFCFC",4);T(impact,"Impact Text","关联 3 个检测任务、1 份待签发报告；建议暂停并发起质量事件调查。",14,14,680,13,"$text-regular");Button(main,"保存处置",510,392,false,100);Button(main,"提交验证",620,392,"danger",118);const side=Box(page,"Exception Timeline",1020,266,396,468,"$surface-panel",6);Timeline(side,22,22);Tag(side,"CAPA 待建立",22,244,"warning");T(side,"Owner","责任部门：检测一组\n截止日期：2026-07-30\n验证人：周复核（演示）",22,290,330,13,"$text-regular")}
function States(page,s){const items=[["加载中","skeleton"],["空结果","empty"],["服务错误","danger"],["权限拒绝","warning"],["禁用操作","info"],["长文本与溢出","brand"]];for(const [i,it] of items.entries()){const col=i%3,row=Math.floor(i/3),b=Box(page,"State/"+it[0],240+col*392,190+row*250,368,222,"$surface-panel",6);T(b,"Title",it[0],18,18,240,16,"$text-primary","600");if(it[1]==="skeleton")Insert(b,{type:"ref",name:"State Skeleton Instance",ref:"cmpStateSkeleton",x:34,y:54,width:300,height:128});else if(it[1]==="empty")Insert(b,{type:"ref",name:"State Empty Instance",ref:"cmpStateEmpty",x:34,y:54,width:300,height:128});else{Ico(b,"State Icon","circle-alert",160,62,it[1]==="danger"?"$semantic-danger":"$semantic-warning",32);T(b,"State Text","当前状态保留业务上下文，并提供明确恢复或申请路径。",38,112,292,13,"$text-regular","400","center");Button(b,it[1]==="danger"?"重新加载":"查看处理路径",112,168,it[1]==="danger"?"danger":false,132)}}}
function DomainStateSamples(page,s){if(s.id==="B12")Insert(page,{type:"ref",name:"Instrument File Empty State",ref:"cmpStateEmpty",x:258,y:246,width:264,height:128});if(s.id==="R03")Insert(page,{type:"ref",name:"Authorization Filter Empty State",ref:"cmpStateEmpty",x:258,y:520,width:220,height:128});if(s.id==="G12")Insert(page,{type:"ref",name:"Interface Monitor Skeleton",ref:"cmpStateSkeleton",x:660,y:500,width:300,height:128})}
function Mobile(page,s){Insert(page,{type:"rectangle",name:"Mobile Topbar",x:0,y:0,width:390,height:52,fill:"$brand-primary"});Ico(page,"Back","chevron-left",14,17,"#FFFFFF",18);T(page,"Mobile Title",s.title,48,15,260,17,"#FFFFFF","600","center");Ico(page,"More","ellipsis",356,17,"#FFFFFF",18);T(page,"Organization","华衡检测实验室（演示）",16,66,260,12,"$text-secondary");if(s.id==="M03"){const scan=Box(page,"Mobile Sample Scanner",12,92,366,218,"#112F2D",8,"$brand-primary");Ico(scan,"Scan","scan-line",137,44,"#FFFFFF",92);T(scan,"Hint","将样品条码置于取景框内",54,154,258,14,"#FFFFFF","600","center");Tag(page,"相机权限已授权",12,326,"success");const summary=Box(page,"Mobile Sample Summary",12,364,366,154,"$surface-panel",6);T(summary,"Title","DEMO-S-260727-01",16,16,250,16,"$text-primary","700");T(summary,"Meta","委托：DEMO-ENT-017\n包装：完好    温度：2-8℃\n目标位置：冷藏库 A-03",16,52,320,13,"$text-regular");const handoff=Box(page,"Mobile Handoff Audit",12,534,366,104,"$surface-panel",6);T(handoff,"Title","交接责任记录",16,14,180,14,"$text-primary","600");T(handoff,"Meta","接收人：陈样品（演示）\n交接时间：2026-07-27 10:26",16,46,320,13,"$text-regular");Button(page,"确认接收与交接",210,662,true,168)}else if(s.id==="M04"){Tag(page,"离线暂存",12,92,"warning");const task=Box(page,"Mobile Task Steps",12,132,366,184,"$surface-panel",6);T(task,"Title","DEMO-TASK-017 · 当前步骤 2/4",16,16,320,15,"$text-primary","700");for(const [i,e] of ["核对样品","录入关键结果","上传附件","提交复核"].entries()){Tag(task,i<1?"完成":i===1?"当前":"待办",16,52+i*30,i<1?"success":i===1?"brand":"info");T(task,"Step",e,88,56+i*30,220,12,"$text-regular")};const record=Box(page,"Mobile Result Record",12,332,366,242,"$surface-panel",6);Field(record,"关键数值","12.68",16,18,334);Field(record,"单位","mg/L",16,104,158);Button(record,"拍照附件",190,126,false,144);WarningAlert(record,"设备状态待同步，提交前必须完成校验。",16,178,334);T(page,"Sync","最近同步：10:28 · 2 条记录待同步",12,594,330,12,"$text-secondary");Button(page,"离线暂存",82,662,false,120);Button(page,"提交复核",212,662,true,120)}else if(s.id==="M05"){const risk=Box(page,"Mobile Signing Block",12,92,366,92,"#FEF0F0",6,"$semantic-danger");T(risk,"Title","授权范围不匹配",16,14,240,15,"$semantic-danger","700");T(risk,"Message","当前签字授权不覆盖报告中的演示项目，不能签发。",16,44,330,13,"$semantic-danger");const report=Box(page,"Mobile Report Summary",12,200,366,150,"$surface-panel",6);T(report,"Title","DEMO-RPT-260727 · V2",16,16,280,16,"$text-primary","700");T(report,"Meta","客户：华衡演示客户\n样品：DEMO-S-031\n项目：演示参数 A、B\n提交人：赵编制（演示）",16,50,330,13,"$text-regular");const checks=Box(page,"Mobile Approval Checklist",12,366,366,176,"$surface-panel",6);for(const [i,e] of ["报告内容完整","结果已审核","认可标识适用","签字授权匹配"].entries()){Insert(checks,{type:"rectangle",name:"Check",x:16,y:18+i*38,width:18,height:18,fill:i<2?"$brand-primary":"#FFFFFF",stroke:i<2?"$brand-primary":"$semantic-danger",strokeWidth:1,cornerRadius:4});T(checks,"Item",e,48,19+i*38,270,13,i===3?"$semantic-danger":"$text-regular",i===3?"600":"400")};T(page,"History","10:12 提交 · 11:05 审核 · 当前等待授权校验",12,566,350,12,"$text-secondary");Button(page,"退回修改",82,662,"danger",120);DisabledButton(page,"禁止签发",212,662,166)}else if(s.kind==="mobileApproval"){WarningAlert(page,"审批前核验授权、完整性和历史意见。",12,92,366);const approval=Box(page,"Mobile Approval Summary",12,156,366,390,"$surface-panel",6);T(approval,"Title","待审批 · DEMO-APP-017",16,16,280,16,"$text-primary","700");for(const [i,e] of ["业务摘要已阅读","附件完整","历史意见已确认","电子签名状态有效"].entries()){Insert(approval,{type:"rectangle",name:"Check",x:16,y:62+i*52,width:18,height:18,fill:i<3?"$brand-primary":"#FFFFFF",stroke:i<3?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(approval,"Item",e,48,62+i*52,280,13,"$text-regular")};T(approval,"History","10:12 提交申请\n11:05 上一节点通过\n当前 等待签名确认",16,286,320,13,"$text-secondary");Button(page,"核验并审批",210,662,true,168)}else{WarningAlert(page,"1 项授权/资源风险需要关注",12,92,366);for(let i=0;i<4;i++){const c=Box(page,"Mobile Card "+(i+1),12,156+i*112,366,96,"$surface-panel",6);Tag(c,i===0?"高优先级":i===3?"已完成":"待处理",14,12,i===0?"danger":i===3?"success":"warning");T(c,"Card Title",s.fields[i%s.fields.length]+" · DEMO-0"+(i+1),14,44,250,15,"$text-primary","600");T(c,"Card Meta",i===3?"完成于 10:26":"截止 2026-07-28 · 林审核",14,70,280,12,"$text-secondary")};Button(page,s.kind==="mobileScan"?"扫码处置":"进入当前任务",210,662,true,168)}Insert(page,{type:"rectangle",name:"Bottom Navigation",x:0,y:788,width:390,height:56,fill:"$surface-panel",stroke:"$border-base",strokeWidth:{top:1}});for(const [i,l] of ["工作台","任务","扫码","我的"].entries())T(page,"Nav/"+l,l,12+i*96,812,80,12,i===0?"$brand-primary":"$text-secondary",i===0?"600":"400","center")}
function Login(page,s){Insert(page,{type:"rectangle",name:"Brand Panel",x:0,y:0,width:560,height:900,fill:"$brand-primary-dark"});T(page,"Product","CNAS 实验室\n信息管理系统",72,160,410,32,"#FFFFFF","700");T(page,"Org","华衡检测实验室（演示）",72,270,360,16,"#D6F4EF","500");T(page,"Scope","通用 ISO/IEC 17025 检测/校准实验室演示环境",72,310,400,13,"#BDE8E1");for(const [i,l] of ["全过程可追溯","受控工作流","质量风险闭环"].entries()){Ico(page,"Check","circle-check",74,390+i*52,"#67C23A",20);T(page,"Feature",l,108,391+i*52,260,15,"#FFFFFF","500")};const form=Box(page,"Login Form",760,170,440,520,"$surface-panel",8,"$border-light");T(form,"Welcome","登录系统",40,42,300,24,"$text-primary","700");T(form,"Hint","使用演示账号进入需求评审环境",40,80,330,13,"$text-secondary");Field(form,"账号","HH-DEMO-017",40,126,360);Field(form,"密码","••••••••",40,212,360);Field(form,"验证码","请输入验证码",40,298,220);Tag(form,"演示环境",280,327,"brand");const btn=Box(form,"Login Button",40,402,360,42,"$brand-primary",4,"$brand-primary");T(btn,"Label","登 录",20,11,320,15,"#FFFFFF","700","center");T(form,"Audit","登录失败、锁定和访问范围均记录安全审计。",40,468,360,12,"$text-secondary")}
function Search(page,s){Filters(page,s);const panel=Box(page,"Search Results",240,286,1176,462,"$surface-panel",6);T(panel,"Summary","找到 128 条结果",18,18,220,16,"$text-primary","600");const cats=["全部 128","客户 18","样品 46","任务 31","报告 20","文件 13"];for(const [i,c] of cats.entries()){Tag(panel,c,18+i*112,52,i===0?"brand":"info")};for(let i=0;i<5;i++){Ico(panel,"Result Icon",["users","flask-conical","clipboard-list","file-text","book-open"][i],20,112+i*62,"$brand-secondary",20);T(panel,"Result Title",["客户","样品","任务","报告","文件"][i]+" · DEMO-260727-0"+(i+1),54,108+i*62,500,14,"$text-primary","600");T(panel,"Result Summary","匹配业务编号、名称和关键摘要；仅显示当前角色可访问内容。",54,132+i*62,720,12,"$text-secondary");Tag(panel,i===3?"部分字段受限":"可查看",980,114+i*62,i===3?"warning":"success")}}
function Permission(page,s){const tree=Box(page,"Organization Tree",240,190,300,544,"$surface-panel",6);T(tree,"Title","组织与菜单",18,18,180,16,"$text-primary","600");for(const [i,l] of ["华衡检测实验室","检测业务部","检测一组","质量管理部","体系与认可","系统管理"].entries()){T(tree,"Tree Node",(i>0?"  ".repeat(Math.min(i,2)):"")+"▸ "+l,18,60+i*54,250,13,i===4?"$brand-primary":"$text-regular",i===4?"600":"400")};const main=Box(page,"Permission Matrix",560,190,856,544,"$surface-panel",6);T(main,"Title",s.title,18,18,300,16,"$text-primary","600");for(const [i,l] of s.fields.entries()){T(main,"Dimension",l,18,66+i*66,180,13,"$text-regular","600");for(let c=0;c<4;c++){const checked=(i+c)%3!==0;Insert(main,{type:"rectangle",name:"Permission Check",x:210+c*130,y:62+i*66,width:20,height:20,fill:checked?"$brand-primary":"#FFFFFF",stroke:checked?"$brand-primary":"$border-base",strokeWidth:1,cornerRadius:4});T(main,"Scope",["查看","新增","审核","管理"][c],238+c*130,64+i*66,70,12,checked?"$text-regular":"$text-secondary")}}const alert=Box(main,"Separation Alert",18,390,820,58,"#FDF6EC",4,"$semantic-warning");T(alert,"Message","职责分离检查：编制、审核和批准不得由同一账号在同一流程中完成。",18,18,760,13,"#7A4C00","600");Button(main,"保存权限",690,476,true,128)}
function QualityChart(page,s){const chart=Box(page,"Quality Control Chart",240,190,820,544,"$surface-panel",6);T(chart,"Title","质控趋势与规则判定",18,18,320,16,"$text-primary","600");for(const [i,l] of [[90,"+3s"],[150,"+2s"],[270,"均值"],[390,"-2s"],[450,"-3s"]].entries()){Insert(chart,{type:"rectangle",name:"Control Line",x:56,y:l[0],width:720,height:1,fill:l[1]==="均值"?"$brand-primary":l[1].includes("3")?"$semantic-danger":"$semantic-warning"});T(chart,"Line Label",l[1],8,l[0]-7,42,11,"$text-secondary","400","right")};for(let i=0;i<12;i++){const yy=230+((i*37)%150)-75;Insert(chart,{type:"ellipse",name:"QC Point",x:70+i*58,y:yy,width:10,height:10,fill:i===9?"$semantic-danger":"$brand-secondary"})};const side=Box(page,"Rule Alerts",1080,190,336,544,"$surface-panel",6);T(side,"Title","规则与调查",18,18,220,16,"$text-primary","600");Tag(side,"失控",18,62,"danger");T(side,"Alert","第 10 点触发规则，相关批次已暂停。",18,102,298,13,"$text-regular","600");for(const [i,l] of ["确认质控品批次","核查设备状态","复核环境记录","评价样品结果"].entries())T(side,"Check","□ "+l,18,160+i*44,280,13,"$text-regular");Button(side,"发起调查",190,468,true,126)}
function render(page,s){if(s.kind==="login")return Login(page,s);AppShell(page,s);Header(page,s);if(s.kind.startsWith("mobile"))return;switch(s.kind){case"dashboard":return Dashboard(page,s);case"states":return States(page,s);case"search":return Search(page,s);case"permission":return Permission(page,s);case"monitor":return Monitor(page,s);case"qualityChart":return QualityChart(page,s);case"receive":return Receive(page,s);case"record":return RecordEditor(page,s);case"import":return ImportData(page,s);case"report":case"reportEditor":case"preview":return ReportEditor(page,s);case"schedule":return s.menu==="培训管理"?TrainingSchedule(page,s):s.menu==="设备管理"?EquipmentSchedule(page,s):Schedule(page,s);case"matrix":case"tree":return MatrixView(page,s);case"audit":return AuditExecution(page,s);case"auditLog":return AuditLogView(page,s);case"review":case"approval":case"changeReview":case"contract":case"accreditationCheck":case"todoAction":return Form(page,s,"review");case"version":case"versionDetail":case"correction":case"withdrawal":return Form(page,s,"version");case"form":case"wizard":case"aliquot":case"handover":case"checkout":case"retention":case"disposal":case"startTask":case"calculation":case"resourceCheck":case"retest":case"qualityControl":case"closeout":case"delivery":case"archive":case"config":case"workflow":case"label":case"storage":return Form(page,s,"form");case"exception":case"capa":return Exception(page,s);case"detail":case"trace":case"profile":case"resultSummary":return Detail(page,s);default:Filters(page,s);return Table(page,s)}}
for(const [i,s] of desktop.entries()){const cols=4,x=(i%cols)*1560,y=440+Math.floor(i/cols)*1020;const page=Insert(sheet,{type:"frame",name:s.id+" "+s.title,x,y,width:1440,height:900,fill:"$surface-page",layout:"none",clip:true,placeholder:true});render(page,s);DomainStateSamples(page,s);Update(page,{placeholder:false})}
for(const [i,s] of mobile.entries()){const x=(i%8)*510,y=440+Math.ceil(desktop.length/4)*1020+Math.floor(i/8)*964;const page=Insert(sheet,{type:"frame",name:s.id+" "+s.title,x,y,width:390,height:844,fill:"$surface-page",layout:"none",clip:true,placeholder:true});Mobile(page,s);Update(page,{placeholder:false})}
Update(sheet,{placeholder:false})
`;
  return Object.entries(componentIds)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((script, [placeholder, id]) => script.replaceAll(placeholder, id), operations);
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
  return {
    cmpButtonPrimary: root('Button/Primary').id,
    cmpButtonPrimaryLabel: child('Button/Primary', 'Label'),
    cmpButtonSecondary: root('Button/Secondary').id,
    cmpButtonSecondaryLabel: child('Button/Secondary', 'Label'),
    cmpButtonDanger: root('Button/Danger').id,
    cmpButtonDangerLabel: child('Button/Danger', 'Label'),
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
    cmpTableHeader: root('Table/Header').id,
    cmpTableRow: root('Table/Row').id,
    cmpStateSkeleton: root('State/Skeleton').id,
    cmpStateEmpty: root('State/Empty').id,
    cmpSwitchOn: root('Form/Switch/On').id,
    cmpSwitchOff: root('Form/Switch/Off').id,
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
  const requiredFields = ['id', 'title', 'role', 'kind', 'goal', 'fields', 'root', 'menu', 'pageType', 'entry', 'back', 'flow', 'requirement'];
  const ids = new Set();
  const errors = [];
  if (domains.length !== 10) errors.push(`设计分卷 ${domains.length}/10`);
  for (const domain of domains) {
    const counts = [domain.pages.filter((page) => !page.id.startsWith('M')).length, domain.pages.filter((page) => page.id.startsWith('M')).length];
    const wanted = expected.get(domain.basename);
    if (!wanted || counts[0] !== wanted[0] || counts[1] !== wanted[1]) errors.push(`${domain.basename} 页面 ${counts.join('/')}/${wanted?.join('/') ?? '未定义'}`);
    for (const page of domain.pages) {
      const missing = requiredFields.filter((field) => page[field] === undefined || page[field] === '');
      if (missing.length) errors.push(`${page.id} 缺少 ${missing.join(',')}`);
      if (!Array.isArray(page.fields) || page.fields.length < 4) errors.push(`${page.id} fields 少于4项`);
      if (!['入口页', '操作页'].includes(page.pageType)) errors.push(`${page.id} pageType 无效`);
      if (ids.has(page.id)) errors.push(`重复页面ID ${page.id}`);
      ids.add(page.id);
      const forbidden = forbiddenVisibleTerms.filter((term) => JSON.stringify(page).includes(term));
      if (forbidden.length) errors.push(`${page.id} 规格禁词 ${forbidden.join(',')}`);
    }
  }
  const desktop = [...ids].filter((id) => !id.startsWith('M')).length;
  const mobile = ids.size - desktop;
  if (desktop !== 130 || mobile !== 6) errors.push(`总页面 ${desktop}/${mobile}，期望130/6`);
  const system = domains.find((domain) => domain.root === '系统管理');
  const requiredSystemMenus = ['组织管理', '用户管理', '角色管理', '权限管理', '审计日志', '工作流配置', '编号规则', '模板管理', '消息配置', '数据字典', '接口监控'];
  const systemMenus = new Set(system?.pages.map((page) => page.menu));
  const missingSystemMenus = requiredSystemMenus.filter((menu) => !systemMenus.has(menu));
  if (missingSystemMenus.length) errors.push(`系统管理缺少 ${missingSystemMenus.join(',')}`);
  if (errors.length) throw new Error(`页面规格校验失败：\n- ${errors.join('\n- ')}`);
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
    '| 设计文件 | 一级菜单 | 桌面页 | 移动页 | 二级功能 |',
    '| --- | --- | ---: | ---: | --- |',
  ];
  const cell = (value) => String(value ?? '').replaceAll('|', '／').replaceAll('\n', ' ');
  for (const domain of domains) {
    const desktop = domain.pages.filter((page) => !page.id.startsWith('M')).length;
    const mobile = domain.pages.length - desktop;
    lines.push(`| \`${domain.basename}.pen/.png\` | ${domain.root} | ${desktop} | ${mobile} | ${[...new Set(domain.pages.map((page) => page.menu))].join('、')} |`);
  }
  for (const domain of domains) {
    lines.push('', `## ${domain.root}`, '',
      '| 页面编号 | 二级菜单 | 页面名称 | 页面类型 | 进入方式 | 返回目标 | 适用角色 | 流程节点 | 关键状态/字段 | 组件模式 | 需求来源 |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const page of domain.pages) {
      lines.push(`| ${cell(page.id)} | ${cell(page.menu)} | ${cell(page.title)} | ${cell(page.pageType)} | ${cell(page.entry)} | ${cell(page.back)} | ${cell(page.role)} | ${cell(page.flow)} | ${cell(page.fields.join('、'))} | ${cell(page.kind)} | ${cell(page.requirement)} |`);
    }
  }
  lines.push('', '## 核心流程覆盖', '',
    '| 流程 | 覆盖范围 |', '| --- | --- |',
    '| P01 客户委托到任务受理 | 客户与委托、检测管理 |',
    '| P02 样品接收到样品处置 | 样品管理、移动扫码交接 |',
    '| P03 检测任务分配到结果审核 | 检测管理、移动任务执行 |',
    '| P04 原始记录到报告发布 | 检测管理、报告管理 |',
    '| P05 人员培训到岗位授权 | 资源管理 |',
    '| P06 设备采购到报废 | 资源管理 |',
    '| P07 文件编制到作废 | 体系管理 |',
    '| P08 不符合项发现到整改关闭 | 质量管理、体系管理 |',
    '| P09 内审到整改验证 | 体系管理 |',
    '| P10 管理评审到改进闭环 | 体系管理 |',
    '| P11 能力验证计划到结果评价 | 质量管理 |',
    '| P12 CNAS 评审问题到整改完成 | 认可管理 |', '',
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
  const document = JSON.parse(await readFile(file, 'utf8'));
  const sheet = document.children?.find((node) => node.name === 'CNAS LIMS Design Contact Sheet');
  if (!sheet) return false;
  const desktopSpecs = domain.pages.filter((page) => !page.id.startsWith('M') && page.kind !== 'login');
  return desktopSpecs.every((spec) => {
    const page = sheet.children?.find((node) => node.name?.startsWith(`${spec.id} `));
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

async function validateDomain(domain, index) {
  const source = join(DESIGN_DIR, `${domain.basename}.pen`);
  const preview = join(DESIGN_DIR, `${domain.basename}.png`);
  const probe = join(DESIGN_DIR, `.validate-${index + 1}.pen`);
  const ids = domain.pages.map((page) => page.id);
  const pagePattern = `^(${ids.join('|')})\\s`;
  const expectedComponents = [
    'Button/Primary', 'Button/Secondary', 'Button/Danger', 'Form/Input',
    'Tag/Success', 'Tag/Warning', 'Tag/Danger', 'Tag/Info', 'Alert/Warning',
    'Table/Header', 'Table/Row', 'State/Skeleton', 'State/Empty', 'Form/Switch/On', 'Form/Switch/Off',
  ];
  const markerByKind = {
    receive: 'Sample Receive Scanner', record: 'Raw Record Grid',
    import: 'Import Reconciliation', report: 'Report Preview', audit: 'Internal Audit Plan',
    auditLog: 'Readonly Audit Log', qualityChart: 'Quality Control Chart', permission: 'Permission Matrix',
  };
  const semanticMarkers = [...new Set(domain.pages.map((page) => {
    if (page.kind === 'schedule') {
      if (page.menu === '培训管理') return 'Training Calendar';
      if (page.menu === '设备管理') return 'Equipment Plan Calendar';
      return 'Resource Scheduling Board';
    }
    return markerByKind[page.kind];
  }).filter(Boolean))];
  if (!semanticMarkers.length) semanticMarkers.push('Page Title');
  if (!existsSync(source)) throw new Error(`Missing design file: ${source}`);
  if (!existsSync(preview)) throw new Error(`Missing preview file: ${preview}`);

  let raw;
  try {
    raw = await runInteractive({
      input: source,
      output: probe,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_get', { patterns: [{ name: pagePattern }], readDepth: 20 }),
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
  if (responses.length < 4) {
    throw new Error(`Expected four Pencil JSON responses for ${domain.basename}, received ${responses.length}`);
  }
  const [pageResponse, componentResponse, semanticResponse, layoutResponse] = responses.slice(-4);
  const pageNodes = pageResponse.nodes ?? [];
  const componentNodes = componentResponse.nodes ?? [];
  const pageDescendants = [];
  const collectDescendants = (node) => {
    pageDescendants.push(node);
    for (const child of node.children ?? []) collectDescendants(child);
  };
  for (const pageNode of pageNodes) collectDescendants(pageNode);
  const refNodes = pageDescendants.filter((node) => node.type === 'ref');
  const textNodes = pageDescendants.filter((node) => node.type === 'text');
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
  const buttonNodes = refNodes.filter((node) => node.name?.startsWith('Button Instance/'));
  const buttonAlignmentProblems = buttonNodes.flatMap((node) => {
    const label = labelForButton(node);
    if (!label) return [`${node.name}:缺少标签节点`];
    const centered = (label.x === 0 && label.width === node.width && label.textAlign === 'center' && label.y >= 6 && label.y <= 9)
      || (label.x === 0 && label.width === 'fill_container' && label.y === 0 && label.textAlign === 'center'
        && label.textAlignVertical === 'middle');
    return centered ? [] : [`${node.name}:标签(${label.x},${label.y},${label.width})/按钮(${node.width})`];
  });
  const disabledButtons = pageDescendants.filter((node) => node.name?.startsWith('Disabled Button/'));
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
  const missingComponents = expectedComponents.filter((name) => !componentNames.includes(name));
  const usedComponentIds = [...new Set(refNodes.map((node) => node.ref).filter((ref) => componentIds.includes(ref)))];
  const usedComponentNames = componentNodes.filter((node) => usedComponentIds.includes(node.id)).map((node) => node.name);
  const missingInstantiatedComponents = expectedComponents.filter((name) => !usedComponentNames.includes(name));
  const semanticNames = semanticNodes.map((node) => node.name);
  const missingSemanticMarkers = semanticMarkers.filter((name) => !semanticNames.includes(name));
  const previewSize = await pngDimensions(preview);
  const expectedPreviewSize = { width: 6120, height: expectedSheetHeight(domain.pages) };
  const artifactHashes = { sourceSha256: await fileSha256(source), previewSha256: await fileSha256(preview) };
  const errors = [];
  const navigationProblems = pageNodes.flatMap((pageNode) => {
    const id = pageNode.name?.split(' ')[0];
    const spec = domain.pages.find((page) => page.id === id);
    if (!spec || spec.kind === 'login' || id?.startsWith('M')) return [];
    const descendants = [];
    const collect = (node) => { descendants.push(node); for (const child of node.children ?? []) collect(child); };
    collect(pageNode);
    const activeRoot = descendants.find((node) => node.name === 'Active Root Menu');
    const rootText = descendants.find((node) => node.name === `Root Menu/${domain.root}`);
    const activeSubmenu = descendants.find((node) => node.name === 'Active Submenu');
    const submenuText = descendants.find((node) => node.name === `Submenu/${spec.menu}`);
    const tab = descendants.find((node) => node.name === 'Tab');
    const pageTitle = descendants.find((node) => node.name === 'Page Title');
    const expectedTab = `${domain.root}  /  ${spec.menu}${spec.pageType === '操作页' ? `  /  ${spec.title}` : ''}`;
    const consistent = activeRoot?.y === rootText?.y - 5
      && activeSubmenu?.y === submenuText?.y - 4
      && tab?.content === expectedTab
      && pageTitle?.content === spec.title;
    return consistent ? [] : [`${id}:${domain.root}/${spec.menu}/${spec.title}`];
  });
  if (pageNodes.length !== domain.pages.length) errors.push(`页面数量 ${pageNodes.length}/${domain.pages.length}`);
  if (missingIds.length) errors.push(`缺少页面 ${missingIds.join(', ')}`);
  if (unexpectedIds.length) errors.push(`意外页面 ${unexpectedIds.join(', ')}`);
  if (invalidSizes.length) errors.push(`尺寸错误 ${invalidSizes.map((node) => node.name).join(', ')}`);
  if (componentNodes.length !== expectedComponents.length) errors.push(`可复用组件数量 ${componentNodes.length}/${expectedComponents.length}`);
  if (missingComponents.length) errors.push(`缺少组件 ${missingComponents.join(', ')}`);
  if (refNodes.length < domain.pages.length) errors.push(`组件实例数量 ${refNodes.length}/${domain.pages.length}，页面复用不足`);
  if (usedComponentIds.length < 7) errors.push(`业务页面组件类型不足 ${usedComponentIds.length}/13`);
  if (missingSemanticMarkers.length) errors.push(`缺少业务语义节点 ${missingSemanticMarkers.join(', ')}`);
  if (navigationProblems.length) errors.push(`导航路径不一致 ${navigationProblems.slice(0, 8).join(', ')}`);
  if (forbiddenFindings.length) errors.push(`可见禁词 ${forbiddenFindings.slice(0, 8).join(', ')}`);
  if (buttonAlignmentProblems.length) errors.push(`按钮文字未居中 ${buttonAlignmentProblems.slice(0, 8).join(', ')}`);
  if (disabledAlignmentProblems.length) errors.push(`禁用按钮文字未居中 ${disabledAlignmentProblems.slice(0, 8).join(', ')}`);
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
    navigationProblems: navigationProblems.length,
    layoutProblems: layoutProblems.length,
    layoutProblemNodes: layoutProblems.slice(0, 5),
    previewSize,
    expectedPreviewSize,
    artifactHashes,
    status: errors.length ? 'failed' : 'passed',
    errors,
  };
}

async function validateDesignSystem(index) {
  const basename = 'cnas-design-system';
  const source = join(DESIGN_DIR, `${basename}.pen`);
  const preview = join(DESIGN_DIR, `${basename}.png`);
  const probe = join(DESIGN_DIR, `.validate-${index + 1}.pen`);
  const expectedSections = [
    'Section/01 设计令牌', 'Section/02 导航', 'Section/03 操作与反馈',
    'Section/04 表单', 'Section/05 数据展示', 'Section/06 流程与审批',
  ];
  const expectedComponents = [
    'Button/Primary', 'Button/Secondary', 'Button/Danger', 'Form/Input',
    'Tag/Success', 'Tag/Warning', 'Tag/Danger', 'Tag/Info', 'Alert/Warning',
    'Table/Header', 'Table/Row', 'State/Skeleton', 'State/Empty',
  ];
  const expectedSemanticMarkers = [
    'Navigation/Sidebar', 'Navigation/Topbar', 'Navigation/Breadcrumb', 'Navigation/Tabs',
    'Navigation/Tree', 'Alert/Warning', 'Result/AccessDenied', 'Modal/Confirm',
    'Upload/Dropzone', 'Form/Switches', 'Form/Validation', 'VbenForm/FilterBar',
    'VxeTable', 'Data/States', 'Timeline/Audit', 'Approval/Opinion',
    'Drawer/Detail', 'Page/Container',
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
        command('snapshot_layout', { problemsOnly: true, maxDepth: 20 }),
        'save()',
        'exit()',
      ],
    });
  } finally {
    await rm(probe, { force: true });
  }

  const responses = extractJsonObjects(raw);
  if (responses.length < 5) {
    throw new Error(`Expected five Pencil JSON responses for ${basename}, received ${responses.length}`);
  }
  const [sheetResponse, sectionResponse, componentResponse, semanticResponse, layoutResponse] = responses.slice(-5);
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
    const operations = pageOperations(domain.pages);
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

if (process.argv.includes('--fingerprint')) {
  process.stdout.write(`${JSON.stringify(await artifactFingerprint(), null, 2)}\n`);
  process.exit(0);
}

if (process.argv.includes('--validate-existing')) {
  validatePageSpecs();
  const report = {
    cli: '@pen.dev/cli@0.3.0',
    results: [],
  };
  for (const [index, domain] of domains.entries()) {
    try {
      report.results.push(await validateDomain(domain, index));
    } catch (error) {
      report.results.push({ design: domain.basename, status: 'failed', errors: [error.message] });
    }
  }
  try {
    report.results.push(await validateDesignSystem(domains.length));
  } catch (error) {
    report.results.push({ design: 'cnas-design-system', status: 'failed', errors: [error.message] });
  }
  report.summary = {
    designs: report.results.length,
    businessDesigns: domains.length,
    designSystems: 1,
    pages: report.results.reduce((sum, result) => sum + (result.pages ?? 0), 0),
    passed: report.results.filter((result) => result.status === 'passed').length,
    failed: report.results.filter((result) => result.status === 'failed').length,
  };
  const reportPath = join(DESIGN_DIR, 'cnas-validation-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.summary.failed) process.exit(1);
  process.exit(0);
}

async function exportOverview(file, basename) {
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
          const clean = raw.replace(ANSI_RE, '');
          const nameIndex = clean.lastIndexOf('"name": "CNAS LIMS Design Contact Sheet"');
          const idIndex = clean.lastIndexOf('"id":', nameIndex);
          const match = idIndex >= 0 ? clean.slice(idIndex, nameIndex).match(/"id"\s*:\s*"([^"]+)"/) : null;
          if (!match) throw new Error('Contact sheet node ID was not returned by batch_get');
          return command('export_nodes', { nodeIds: [match[1]], outputDir: exportDir, scale: 1 });
        },
        'save()',
        'exit()',
      ],
    });
    const exportedFiles = (await readdir(exportDir)).filter((name) => name.toLowerCase().endsWith('.png'));
    const domain = domains.find((candidate) => candidate.basename === basename);
    const expectedSize = domain
      ? { width: 6120, height: expectedSheetHeight(domain.pages) }
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
    const raw = await runInteractiveOnce({
      input: exportSource,
      output: exportSource,
      timeoutMs: 120_000,
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

if (process.argv.includes('--generate-design-system') || process.argv.includes('--export-design-system')) {
  await mkdir(DESIGN_DIR, { recursive: true });
  const output = join(DESIGN_DIR, 'cnas-design-system.pen');
  if (process.argv.includes('--generate-design-system')) {
    await rm(output, { force: true });
    await runInteractive({
      output,
      commands: [
        command('get_editor_state', { include_schema: false }),
        command('batch_design', { input: `${templateOperations()}\n${designSystemOperations()}` }),
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

await mkdir(DESIGN_DIR, { recursive: true });
validatePageSpecs();
await writePageMap();
await rm(TEMPLATE, { force: true });
const templateRaw = await runInteractive({
  output: TEMPLATE,
  commands: [
    command('get_editor_state', { include_schema: false }),
    command('batch_design', { input: templateOperations() }),
    command('batch_get', { patterns: [{ reusable: true }], readDepth: 1 }),
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
  await rm(output, { force: true });
  await runInteractive({
    input: TEMPLATE,
    output,
    commands: [
      command('get_editor_state', { include_schema: false }),
      command('batch_design', { input: pageOperations(domain.pages, componentIds) }),
      command('get_variables', {}),
      command('snapshot_layout', { problemsOnly: true, maxDepth: 5 }),
      'save()',
      'exit()',
    ],
  });
  await exportOverview(output, domain.basename);
}

await rm(TEMPLATE, { force: true });
for (const legacy of legacyDomains) {
  await rm(join(DESIGN_DIR, `${legacy.basename}.pen`), { force: true });
  await rm(join(DESIGN_DIR, `${legacy.basename}.png`), { force: true });
}
await rm(join(DESIGN_DIR, 'prompts'), { recursive: true, force: true });
await rm(join(DESIGN_DIR, '.export-debug-dir'), { recursive: true, force: true });
process.stdout.write('All CNAS Pencil design files generated.\n');
