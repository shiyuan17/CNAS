import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const relative = path => resolve(root, path);
const fail = message => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const requireFile = path => {
  if (!existsSync(relative(path))) fail(`missing required file: ${path}`);
};
const read = path => readFileSync(relative(path), 'utf8');

const requiredFiles = [
  'html_design/index.html',
  'html_design/assets/styles.css',
  'html_design/assets/prototype-runtime.js',
  'html_design/prototype-spec.md',
  'html_design/prototype-manifest.json',
  'docs/baseline/cnas-lims-tbd-decision-workbook.md'
];
requiredFiles.forEach(requireFile);
if (process.exitCode) process.exit(process.exitCode);

let manifest;
try {
  manifest = JSON.parse(read('html_design/prototype-manifest.json'));
} catch (error) {
  fail(`manifest is not valid JSON: ${error.message}`);
  process.exit(process.exitCode);
}

const expectedIds = [
  'WB01', 'WB02', 'CON01', 'CON02', 'SMP01', 'CAL01', 'TASK01', 'TASK02',
  'REC01', 'REC02', 'REV01', 'RPT01', 'RPT02', 'RPT03', 'PERS01', 'MTH01',
  'RES01', 'RES02', 'SUP01', 'QUAL01', 'QUAL02', 'DOC01', 'AUD01', 'ACC01',
  'SYS01', 'SYS02'
];
const ids = manifest.pages?.map(page => page.id) ?? [];
const unique = values => [...new Set(values)];

if (manifest.pageCount !== 26 || ids.length !== 26 || unique(ids).length !== 26) {
  fail('manifest must declare exactly 26 unique pages');
}
if (expectedIds.some(id => !ids.includes(id)) || ids.some(id => !expectedIds.includes(id))) {
  fail('manifest page IDs do not match the approved 26-page scope');
}

const routes = manifest.pages?.map(page => page.route) ?? [];
if (unique(routes).length !== 26) fail('each prototype page must have a unique route');

for (const page of manifest.pages ?? []) {
  const issues = [];
  if (page.route !== `#/${page.id}`) issues.push('route');
  if (!page.title || !page.group || !page.module || !page.role || !page.status) issues.push('identity metadata');
  if (!Array.isArray(page.requirements) || page.requirements.length === 0) issues.push('requirement reference');
  if (!Array.isArray(page.candidateNotes) || page.candidateNotes.length === 0) issues.push('candidate note');
  if (!Array.isArray(page.actions) || page.actions.length === 0) issues.push('action');
  if (!ids.includes(page.next)) issues.push('navigation target');
  if (issues.length) fail(`${page.id} missing or invalid ${issues.join(', ')}`);
}

const spec = read('html_design/prototype-spec.md');
if (!spec.includes('候选原型') || !spec.includes('不构成业务或开发基线')) {
  fail('prototype spec must retain the candidate/non-baseline declaration');
}
if (!spec.includes('26 个唯一页面')) fail('prototype spec must state the 26-page acceptance condition');
if (!spec.includes('发布失败与恢复')) fail('prototype spec must cover report publishing recovery');

const runtime = read('html_design/assets/prototype-runtime.js');
for (const requiredRuntimeTerm of ['localStorage', '模拟权限拒绝', '重置模拟', '受控重试发布', '本地审计轨迹']) {
  if (!runtime.includes(requiredRuntimeTerm)) fail(`runtime missing required interaction: ${requiredRuntimeTerm}`);
}

const index = read('html_design/index.html');
if (!index.includes('prototype-runtime.js') || !index.includes('styles.css')) {
  fail('index must load the shared prototype runtime and stylesheet');
}

const workbook = read('docs/baseline/cnas-lims-tbd-decision-workbook.md');
if (!workbook.includes('影响 P0 的 24 项全部关闭') ||
    !workbook.includes('P0 门禁集合为 `TBD-001~022`、`TBD-024` 和 `TBD-025`') ||
    !workbook.includes('`TBD-023` 仅在历史数据迁移范围确认后进入技术基线门禁')) {
  fail('TBD P0 gate must be 24 items with TBD-023 deferred');
}

if (!process.exitCode) {
  console.log(`PASS: candidate prototype manifest, runtime, specification and P0 TBD gate validated (${ids.length} pages).`);
}
