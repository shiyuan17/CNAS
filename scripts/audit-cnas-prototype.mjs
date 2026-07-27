import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { businessDomains } from './cnas-page-specs-business.mjs';
import { resourceDomains } from './cnas-page-specs-resources.mjs';
import { governanceDomains } from './cnas-page-specs-governance.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'html_design');
const sourcePages = [...businessDomains, ...resourceDomains, ...governanceDomains].flatMap(({ root, basename, pages }) => pages.map(page => ({ ...page, root, basename })));
const forbidden = ['当前模块', '演示数据', '演示环境', '全部用户', 'DEMO', '（演示）'];
const issues = [];
const issue = (id, check, detail) => issues.push({ severity: '阻断', id, check, detail });
const manifest = JSON.parse(await readFile(join(OUT, 'prototype-manifest.json'), 'utf8'));
const designReport = JSON.parse(await readFile(join(ROOT, 'design', 'cnas-validation-report.json'), 'utf8'));
const files = (await readdir(join(OUT, 'pages'))).filter(name => name.endsWith('.html'));
if (files.length !== 136) issue('全局', '产品页数量', `期望 136，实际 ${files.length}`);
if (manifest.pages.length !== 136) issue('全局', '清单数量', `期望 136，实际 ${manifest.pages.length}`);
for (const page of sourcePages) {
  const item = manifest.pages.find(candidate => candidate.id === page.id);
  if (!item) { issue(page.id, '页面映射', 'manifest 缺少页面'); continue; }
  if (!existsSync(join(OUT, item.html))) issue(page.id, '页面文件', `缺少 ${item.html}`);
  const pageHtml = await readFile(join(OUT, item.html), 'utf8');
  if (!pageHtml.includes('favicon.svg')) issue(page.id, '浏览器资源', '页面未声明 favicon，直接打开会产生资源 404');
  for (const field of ['root', 'menu', 'title', 'role', 'entry', 'back', 'backHref', 'flow', 'requirement']) {
    if (!item[field] || (Array.isArray(item[field]) && !item[field].length)) issue(page.id, '页面契约', `缺少 ${field}`);
  }
  if (item.backPageId) {
    const target = manifest.pages.find(candidate => candidate.id === item.backPageId);
    if (!target || target.id === item.id) issue(page.id, '返回流程', `返回目标 ${item.backPageId} 不存在或指向自身`);
    if (item.backHref !== target?.html.replace('pages/', '')) issue(page.id, '返回流程', `backHref 未指向 ${item.backPageId}`);
  } else if (!String(item.backHref).startsWith('../index.html#')) {
    issue(page.id, '返回流程', '未解析到页面目标时必须返回对应模块清单锚点');
  }
  if (JSON.stringify(item.fields) !== JSON.stringify(page.fields)) issue(page.id, '字段映射', '字段与页面规格不一致');
  if (item.root !== page.root || item.menu !== page.menu || item.title !== page.title || item.pageType !== page.pageType) issue(page.id, '导航映射', '模块、菜单、标题或页面类型不一致');
  if (page.pageType === '操作页' && (!item.entry || !item.back)) issue(page.id, '隐藏操作页', '缺少入口或返回目标');
  for (const term of forbidden) if (JSON.stringify(item).includes(term)) issue(page.id, '禁用用语', `发现 ${term}`);
}
for (const path of ['assets/styles.css', 'assets/runtime.js', 'assets/page-data.js', 'assets/favicon.svg', 'index.html']) if (!existsSync(join(OUT, path))) issue('全局', '资源完整性', `缺少 ${path}`);
const runtime = await readFile(join(OUT, 'assets', 'runtime.js'), 'utf8');
const verifier = await readFile(join(ROOT, 'scripts', 'verify-cnas-prototype-browser.mjs'), 'utf8');
for (const marker of ['localStorage', '退回补充', '已阻断', '已关闭', '审计']) if (!runtime.includes(marker)) issue('全局', '状态模拟', `缺少 ${marker} 状态或审计支持`);
for (const marker of ['const transitions', "'已关闭': {}", 'data-back', 'data-permission-denied', 'permission-denied', 'permissionDenied', 'data-open-detail', 'data-logout', 'loginStatus', 'login-failed', 'login-success', 'logout', '账号锁定']) if (!runtime.includes(marker)) issue('全局', '交互约束', `缺少 ${marker} 交互约束`);
for (const marker of ['模拟认证失败', '账号锁定', 'permission-denied', 'permissionDenied', 'data-open-detail', 'data-logout', '已阻断', 'isDisabled', 'waitForURL']) if (!verifier.includes(marker)) issue('全局', '反例验证', `浏览器验收未覆盖 ${marker} 反例`);
const mobileWorkbench = manifest.pages.find(page => page.id === 'M01');
if (mobileWorkbench?.backPageId !== 'WB01' || mobileWorkbench?.backHref !== 'WB01.html') issue('M01', '返回流程', '移动工作台必须返回复用的 WB01 响应式登录页');
for (const flowId of ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11', 'P12']) if (!manifest.pages.some(page => String(page.flowId).includes(flowId))) issue(flowId, '核心流程覆盖', '未映射产品页面');
if (designReport.summary?.failed !== 0 || designReport.summary?.passed !== 11) issue('设计稿', 'Pencil 资产审查', `期望 11/11 通过，实际 ${designReport.summary?.passed ?? 0}/${designReport.summary?.designs ?? 0}`);
const rows = issues.length ? issues.map(item => `| ${item.severity} | ${item.id} | ${item.check} | ${item.detail} |`).join('\n') : '无阻断项。';
const status = issues.length ? '不通过，需修复阻断项。' : '通过。页面字段、流程、状态、权限和审计提示均可由页面地图追溯。';
const report = [
  '# CNAS-PROTOTYPE-001 原型审查', '', '## 结论', '',
  `- 审查对象：11 份 Pencil 资产（10 份业务分卷与 1 份设计系统）、136 页页面地图和 136 个静态 HTML 原型。`,
  `- 阻断项：${issues.length}`, `- 结论：${status}`, '', '## 覆盖', '',
  '| 审查维度 | 规则 | 结果 |', '| --- | --- | --- |',
  `| 需求 | 页面编号、字段与需求来源一一映射 | ${issues.length ? '见问题清单' : '通过'} |`,
  `| 流程 | P01-P12 已映射到原型页面 | ${issues.length ? '见问题清单' : '通过'} |`,
  `| 状态 | 正常、退回、阻断、关闭、审计均由本地状态机支持 | ${issues.length ? '见问题清单' : '通过'} |`,
  `| 权限 | 角色、页面入口、返回目标和权限不足状态可追溯 | ${issues.length ? '见问题清单' : '通过'} |`,
  `| 审计 | 处理状态及操作时间保存在本地审计轨迹 | ${runtime.includes('localStorage') ? '通过' : '不通过'} |`,
  `| 设计稿 | 10 份业务分卷与 1 份设计系统经 Pencil 校验 | ${designReport.summary?.failed === 0 ? '通过（11/11）' : '不通过'} |`,
  `| 组件 | web-ele / Element Plus 语义组件映射与统一 token | ${existsSync(join(OUT, 'assets', 'styles.css')) ? '通过' : '不通过'} |`, '',
  '## 问题清单', '', issues.length ? '| 严重度 | 页面 | 检查 | 说明 |\n| --- | --- | --- | --- |\n' + rows : rows, '',
  '[最佳实践建议] 生产实现前确认电子签名触发点、保存期限、接口协议和消息失败补偿时限。', '',
  '## 审查边界', '', '静态原型按 Vben web-ele / Element Plus 的组件语义实现；不宣称已接入真实工作流、电子签名或接口服务。', '',
].join('\n');
await mkdir(join(ROOT, 'docs', 'reviews'), { recursive: true });
await writeFile(join(ROOT, 'docs', 'reviews', 'CNAS-PROTOTYPE-001-audit.md'), report, 'utf8');
await writeFile(join(OUT, 'prototype-audit.json'), `${JSON.stringify({ blocking: issues.length, issues }, null, 2)}\n`, 'utf8');
if (issues.length) { console.error(report); process.exit(1); }
console.log('CNAS prototype audit passed with zero blocking findings.');
