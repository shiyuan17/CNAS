# CNAS-DESIGN-003 全模块专项页面设计

- 工作流档位：完整
- 当前阶段：集成验证完成，独立核验受本地 Pencil IPC 限制阻塞
- 当前状态：实现完成，等待可隔离的独立核验
- 处理结果：条件交付

## 目标

将 10 个 CNAS 设计分卷的 136 个页面提升为 Pencil 顶层可编辑画板，并用专项操作、审批、流程、核验和生命周期页面替换通用表单回退。

## 验收标准

| AC-ID | 标准 |
| --- | --- |
| AC-01 | 10 个模块保留 136 页、130 个桌面和 6 个移动画板，且业务页为顶层画板。 |
| AC-02 | 操作、流程、审批、核验和生命周期页面使用专项渲染器并带有可验证语义标记。 |
| AC-03 | 每个 `.pen` 有同名 PNG 联系表，联系表覆盖该模块的全部页面。 |
| AC-04 | Pencil 结构、尺寸、导航、组件实例、文本与布局检查通过。 |

## 验证计划

运行生成操作语法检查、串行 Pencil 生成、现有设计结构校验、PNG 配对检查、`git diff --check` 和每模块操作页抽查。冻结变更集后派发独立 Tester 与 Reviewer，并在 fan-in 后重跑集成验证。

## 完整流程控制

```json
{
  "控制版本": 3,
  "任务类型": "父任务",
  "集成验证": [
    "node scripts/generate-cnas-pencil-designs.mjs --check-generated",
    "node scripts/generate-cnas-pencil-designs.mjs --generate-modules",
    "node scripts/generate-cnas-pencil-designs.mjs --validate-existing",
    "git diff --check"
  ],
  "责任角色": "实现负责人",
  "写入范围": [
    "scripts/generate-cnas-pencil-designs.mjs",
    "scripts/cnas-page-specs-business.mjs",
    "scripts/cnas-page-specs-resources.mjs",
    "scripts/cnas-page-specs-governance.mjs",
    "design/cnas-01-*.pen",
    "design/cnas-01-*.png",
    "design/cnas-02-*.pen",
    "design/cnas-02-*.png",
    "design/cnas-03-*.pen",
    "design/cnas-03-*.png",
    "design/cnas-04-*.pen",
    "design/cnas-04-*.png",
    "design/cnas-05-*.pen",
    "design/cnas-05-*.png",
    "design/cnas-06-*.pen",
    "design/cnas-06-*.png",
    "design/cnas-07-*.pen",
    "design/cnas-07-*.png",
    "design/cnas-08-*.pen",
    "design/cnas-08-*.png",
    "design/cnas-09-*.pen",
    "design/cnas-09-*.png",
    "design/cnas-10-*.pen",
    "design/cnas-10-*.png",
    "design/cnas-validation-report.json",
    "docs/tasks/CNAS-DESIGN-003.md",
    "docs/reviews/CNAS-DESIGN-003-red-team.md"
  ],
  "禁止动作": ["修改 mvp_design", "修改前端、接口、数据库或页面地图", "手工编辑 .pen"],
  "输入": ["现有 CNAS token、组件、页面规格和 Pencil 设计资产"],
  "输出格式": ["交付记录中的变更、验证和风险"],
  "不得修改范围": ["mvp_design/ 及用户未归属改动"],
  "依赖任务": [],
  "子任务": ["业务链页面规格", "资源质量页面规格", "体系认可系统页面规格", "Tester", "Reviewer"],
  "执行批次": ["三组页面规格并行", "主生成器集成与串行导出", "Tester 与 Reviewer 并行"],
  "冲突任务": ["共享生成器与设计输出由主智能体独占"],
  "并行安全": "领域页面规格文件写入范围互不重叠；Pencil 产物串行生成",
  "时间盒分钟": 120,
  "停止条件": "验收标准全部获得有效证据",
  "回滚方案": "仅撤销本任务对生成器、页面规格和生成资产的变更",
  "人工确认": "不需要",
  "核验者": "cognis_tester",
  "红队审查者": "cognis_reviewer",
  "红队审查包": "docs/reviews/CNAS-DESIGN-003-red-team.md",
  "红队审查结论": "待审查",
  "独立核验模式": "原生子智能体",
  "合并回主线状态": "不需要"
}
```

## 交接记录

```json
[
  {
    "编号": "H-001",
    "类型": "Tester",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "状态": "阻塞",
    "收据": "冻结集在并发 Pencil 核验期间失稳，收据作废",
    "指纹": "9abbbe9a8c8f9e21b6db561297454c6fd739acaed8df8420c079f74499e3887e"
  },
  {
    "编号": "H-002",
    "类型": "Reviewer",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "状态": "已返回",
    "收据": "要求修改：恢复缺失模块、修正顶层读取与验证副作用后重派",
    "指纹": "9abbbe9a8c8f9e21b6db561297454c6fd739acaed8df8420c079f74499e3887e"
  },
  {
    "编号": "H-003",
    "类型": "Tester",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "状态": "阻塞（无效）",
    "收据": "Tester 与其他 Pencil 进程并发访问共享命名管道，无法得到可归责、稳定的独立收据；不得将该次结果作为通过证据。",
    "指纹": "997b9c1c377c3f53485aa615e550cb0b7eac15b8cc9e4136b51d5ac3ad2ec9ed"
  },
  {
    "编号": "H-004",
    "类型": "Reviewer",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "状态": "阻塞（无效）",
    "收据": "Reviewer 曾导入生成器并触发默认生成副作用，冻结集不再稳定；虽已补充脚本直接执行保护，本轮未取得新的独立只读收据。",
    "指纹": "997b9c1c377c3f53485aa615e550cb0b7eac15b8cc9e4136b51d5ac3ad2ec9ed"
  }
]
```

## 验收证据

| AC-ID | 证据类型 | 命令或产物 | 退出码 | 核验时间 | 核验者 | 实际结果 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | 集成结构校验 | `node scripts/generate-cnas-pencil-designs.mjs --validate-existing --write-validation-report` | 0 | 2026-07-29 | 实现负责人 | 10 个业务分卷、136 页，其中 130 个桌面和 6 个移动页面；业务页均为顶层画板。 |
| AC-02 | 集成结构校验 | 同上 | 0 | 2026-07-29 | 实现负责人 | 专项语义标记存在，94 个页面分类为审批、流程、核验或生命周期渲染器。 |
| AC-03 | 产物配对检查 | PowerShell `Test-Path` 配对检查 | 0 | 2026-07-29 | 实现负责人 | 10 个模块均存在同名 `.pen` 与 `.png` 联系表；临时 `.cnas-base-template.pen` 不存在。 |
| AC-04 | Pencil CLI 重开校验 | 同上 | 0 | 2026-07-29 | 实现负责人 | 11 份设计资产全部通过；布局、导航、按钮对齐及顶层画板问题均为 0。 |
| AC-04 | 静态检查 | `node scripts/generate-cnas-pencil-designs.mjs --check-generated` 与 `git diff --check` | 0 | 2026-07-29 | 实现负责人 | 生成操作语法有效，Git diff 无空白错误。 |

## 剩余风险

Pencil 导出依赖本地共享 IPC；生成、导出和任何使用 Pencil CLI 的独立核验必须保持串行。两份原生独立收据因上述限制无效，尚需在无其他 Pencil 进程、且 Reviewer 不导入生成器的隔离会话中重派，才能满足完整工作流的独立核验门禁。
