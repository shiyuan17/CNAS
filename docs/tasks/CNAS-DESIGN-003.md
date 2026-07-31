# CNAS-DESIGN-003 全模块操作页与流程状态修订

- 工作流档位：完整
- 当前阶段：交付
- 当前状态：已完成
- 处理结果：Tester 通过，Reviewer 批准

## 目标

移除 10 个模块设计稿中的 Contact Sheet 设计系统头部，为所有可见操作建立可反查的页面、抽屉、弹窗或页内动作契约，并统一 P01-P12 跨页面主流程与局部交互步骤状态。

## 验收标准

| AC-ID | 标准 |
| --- | --- |
| AC-01 | 10 个模块 `.pen` 不包含 Contact Sheet；设计系统文件继续保留规范总览。 |
| AC-02 | 每个可见动作均有 `actionContracts`，页面目标、状态画板或页内效果完整且目标可达。 |
| AC-03 | `TM01` 新增/查看、`R23` 新增/完整档案均有对应画板。 |
| AC-04 | P01-P12 使用真实 1-based 节点状态；P02 中 `SM06=4`、`SM08=6`。 |
| AC-05 | P07 为 `GOV01 -> GOV02 -> GOV03 -> GOV04 -> GOV04-EXEC -> GOV06 -> GOV08`；签收与回收未完成时停留并阻断归档。 |
| AC-06 | 10 组 `.pen/.png`、页面地图和校验报告同步，结构、导航、布局、预览尺寸及哈希检查通过。 |

## 验证计划

运行三组规格静态导入、生成操作语法检查、页面地图生成、现有 Pencil 资产全量结构校验、验收点定向断言、PNG 拼图人工检查和 `git diff --check`。冻结变更集后并行派发独立 Tester 与 Reviewer，fan-in 后由主 Agent 重跑集成验证。

## 完整流程控制

```json
{
  "控制版本": 3,
  "任务类型": "父任务",
  "集成验证": [
    "node scripts/generate-cnas-pencil-designs.mjs --check-generated",
    "node scripts/generate-cnas-pencil-designs.mjs --write-page-map",
    "node scripts/generate-cnas-pencil-designs.mjs --validate-existing --write-validation-report",
    "node scripts/generate-cnas-pencil-designs.mjs --fingerprint",
    "git diff --check"
  ],
  "责任角色": "实现负责人",
  "写入范围": [
    "scripts/cnas-page-specs-business.mjs",
    "scripts/cnas-page-specs-resources.mjs",
    "scripts/cnas-page-specs-governance.mjs",
    "scripts/generate-cnas-pencil-designs.mjs",
    "design/cnas-01-*.pen/png 至 design/cnas-10-*.pen/png",
    "design/cnas-page-map.md",
    "design/cnas-validation-report.json",
    "docs/tasks/CNAS-DESIGN-003.md",
    "docs/reviews/CNAS-DESIGN-003-red-team.md"
  ],
  "禁止动作": ["修改 mvp_design", "修改前端、接口或数据库", "手工编辑 .pen", "覆盖用户未归属改动"],
  "输入": ["现有 CNAS 设计系统、页面规格、用户验收截图和 Pencil 设计资产"],
  "输出格式": ["状态", "变更摘要", "变更路径", "验证证据", "未验证项", "剩余风险", "下一步动作"],
  "不得修改范围": ["mvp_design/", ".agents/", "用户未归属改动"],
  "依赖任务": [],
  "子任务": ["业务动作规格", "资源质量动作规格", "治理系统动作规格", "Tester", "Reviewer"],
  "执行批次": ["三组规格并行", "主生成器串行集成与 Pencil 产物生成", "Tester 与 Reviewer 并行只读核验"],
  "冲突任务": ["共享生成器、页面地图和设计产物由主 Agent 独占"],
  "并行安全": "领域规格文件写入范围不重叠；Pencil CLI 始终串行；冻结后核验角色只读",
  "时间盒分钟": 180,
  "停止条件": "AC-01 至 AC-06 全部获得当前工作区证据，Tester 通过且 Reviewer 批准",
  "回滚方案": "仅撤销本任务对规格、生成器、任务记录和生成设计资产的变更",
  "人工确认": "不需要",
  "核验者": "cognis_tester",
  "红队审查者": "cognis_reviewer",
  "红队审查包": "docs/reviews/CNAS-DESIGN-003-red-team.md",
  "红队审查结论": "批准",
  "独立核验模式": "原生子智能体",
  "合并回主线状态": "不需要"
}
```

## 交接记录

```json
[
  {
    "版本": 1,
    "编号": "H-005",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "Agent/运行收据": "native-cognis_tester-20260730-a",
    "状态": "待接收",
    "变更集指纹": "18743f4eb0591a913c0d0b9e316530255bd0d2ffbaed0784e1504a9ff4ec04a4",
    "已完成": ["首轮变更集冻结"],
    "未完成": ["独立验收核验"],
    "验证证据": ["design/cnas-validation-report.json"],
    "未验证项": ["Tester 尚未回传"],
    "风险": ["首轮生成器语义门禁可能存在缺口"],
    "下一步": "按 AC-01 至 AC-06 只读核验",
    "恢复提示": "从首轮冻结指纹开始",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-005",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "Agent/运行收据": "native-cognis_tester-20260730-a",
    "状态": "已接收",
    "变更集指纹": "18743f4eb0591a913c0d0b9e316530255bd0d2ffbaed0784e1504a9ff4ec04a4",
    "已完成": ["接收首轮冻结变更集"],
    "未完成": ["回传核验结论"],
    "验证证据": ["design/cnas-validation-report.json"],
    "未验证项": ["最终结论尚未形成"],
    "风险": ["首轮校验未覆盖控件语义"],
    "下一步": "执行验收标准核验",
    "恢复提示": "继续首轮 Tester 核验",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-005",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "Agent/运行收据": "native-cognis_tester-20260730-a",
    "状态": "已返回",
    "变更集指纹": "18743f4eb0591a913c0d0b9e316530255bd0d2ffbaed0784e1504a9ff4ec04a4",
    "已完成": ["Tester 首轮结论：通过"],
    "未完成": ["首轮收据因后续实现修改失效"],
    "验证证据": ["design/cnas-validation-report.json"],
    "未验证项": ["最终冻结指纹未核验"],
    "风险": ["该收据不得用于最终封存"],
    "下一步": "在最终冻结指纹上重新派发 Tester",
    "恢复提示": "使用新 turn 和新指纹重新核验",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-006",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "Agent/运行收据": "native-cognis_reviewer-20260730-a",
    "状态": "待接收",
    "变更集指纹": "18743f4eb0591a913c0d0b9e316530255bd0d2ffbaed0784e1504a9ff4ec04a4",
    "已完成": ["首轮变更集冻结"],
    "未完成": ["独立审查与 Red Team"],
    "验证证据": ["docs/reviews/CNAS-DESIGN-003-red-team.md"],
    "未验证项": ["Reviewer 尚未回传"],
    "风险": ["动作状态与流程步骤语义可能存在缺口"],
    "下一步": "执行 findings-first 只读审查",
    "恢复提示": "从首轮冻结指纹和审查包开始",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-006",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "Agent/运行收据": "native-cognis_reviewer-20260730-a",
    "状态": "已接收",
    "变更集指纹": "18743f4eb0591a913c0d0b9e316530255bd0d2ffbaed0784e1504a9ff4ec04a4",
    "已完成": ["接收首轮冻结变更集"],
    "未完成": ["回传审查结论"],
    "验证证据": ["docs/reviews/CNAS-DESIGN-003-red-team.md"],
    "未验证项": ["最终结论尚未形成"],
    "风险": ["校验器可能遗漏语义问题"],
    "下一步": "执行 Red Team 审查",
    "恢复提示": "继续首轮 Reviewer 审查",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-006",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "Agent/运行收据": "native-cognis_reviewer-20260730-a",
    "状态": "已返回",
    "变更集指纹": "18743f4eb0591a913c0d0b9e316530255bd0d2ffbaed0784e1504a9ff4ec04a4",
    "已完成": ["Reviewer 首轮结论：要求修改", "识别归档按钮、局部步骤、动作一致性、临时文件和 Handoff 问题"],
    "未完成": ["首轮收据因后续实现修改失效"],
    "验证证据": ["docs/reviews/CNAS-DESIGN-003-red-team.md"],
    "未验证项": ["修复后的最终冻结指纹未审查"],
    "风险": ["该负面收据保留为历史，不得用于最终批准"],
    "下一步": "修复 findings 后使用新 turn 重新派发 Reviewer",
    "恢复提示": "核对五项 findings 的修复与反例断言",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-007",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "Agent/运行收据": "native-cognis_tester-20260731-b",
    "状态": "待接收",
    "变更集指纹": "faf0f82202b3051a38bae3f64c9a1a4aae0059c7f9655107349f97bc3d665d92",
    "已完成": ["最终实现与 10 组设计资产冻结", "主 Agent 全量校验 11/11 通过"],
    "未完成": ["最终独立 Tester 核验", "fan-in 后集成验证"],
    "验证证据": ["design/cnas-validation-report.json", "design/cnas-page-map.md"],
    "未验证项": ["最终 Tester 尚未回传"],
    "风险": ["Pencil CLI 使用共享 IPC，核验期间不得并发运行其他 Pencil 命令"],
    "下一步": "按 AC-01 至 AC-06 对最终指纹只读核验",
    "恢复提示": "核对最终指纹、关键动作目标、双步骤器和 P07 阻断",
    "时间": "2026-07-31"
  },
  {
    "版本": 1,
    "编号": "H-008",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "Agent/运行收据": "native-cognis_reviewer-20260731-b",
    "状态": "待接收",
    "变更集指纹": "faf0f82202b3051a38bae3f64c9a1a4aae0059c7f9655107349f97bc3d665d92",
    "已完成": ["首轮 findings 全部修复", "最终实现与设计资产冻结", "主 Agent 全量校验 11/11 通过"],
    "未完成": ["最终独立 Reviewer 审查", "fan-in 后集成验证"],
    "验证证据": ["docs/reviews/CNAS-DESIGN-003-red-team.md", "design/cnas-validation-report.json", "design/cnas-page-map.md"],
    "未验证项": ["最终 Reviewer 尚未回传"],
    "风险": ["需反证校验器是否仍可漏过动作状态和局部步骤语义"],
    "下一步": "执行 findings-first 只读审查并承担 Red Team",
    "恢复提示": "重点复核首轮五项 findings、实际 diff、关键映射和阻断条件",
    "时间": "2026-07-31"
  },
  {
    "版本": 1,
    "编号": "H-009",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_tester",
    "Agent/运行收据": "native-cognis_tester-final-20260730-c",
    "状态": "待接收",
    "变更集指纹": "4d294a3f1fd214aa07a7ee4ae2faae74254db0be0aaabb03dd882ccfcc2e18d1",
    "已完成": ["最终实现与 10 组设计资产冻结", "主 Agent 全量校验 11/11 通过"],
    "未完成": ["最终独立 Tester 核验", "fan-in 后集成验证"],
    "验证证据": ["design/cnas-validation-report.json", "design/cnas-page-map.md"],
    "未验证项": ["最终 Tester 尚未回传"],
    "风险": ["Pencil CLI 使用共享 IPC，核验期间不得并发运行其他 Pencil 命令"],
    "下一步": "按 AC-01 至 AC-06 对最终指纹只读核验",
    "恢复提示": "核对最终指纹、关键动作目标、双步骤器和 P07 阻断",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-010",
    "类型": "阶段交接",
    "来源角色": "实现负责人",
    "目标角色": "cognis_reviewer",
    "Agent/运行收据": "native-cognis_reviewer-final-20260730-c",
    "状态": "待接收",
    "变更集指纹": "4d294a3f1fd214aa07a7ee4ae2faae74254db0be0aaabb03dd882ccfcc2e18d1",
    "已完成": ["首轮 findings 全部修复", "最终实现与设计资产冻结", "主 Agent 全量校验 11/11 通过"],
    "未完成": ["最终独立 Reviewer 审查", "fan-in 后集成验证"],
    "验证证据": ["docs/reviews/CNAS-DESIGN-003-red-team.md", "design/cnas-validation-report.json", "design/cnas-page-map.md"],
    "未验证项": ["最终 Reviewer 尚未回传"],
    "风险": ["需反证校验器是否仍可漏过动作状态和局部步骤语义"],
    "下一步": "执行 findings-first 只读审查并承担 Red Team",
    "恢复提示": "重点复核首轮五项 findings、实际 diff、关键映射和阻断条件",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-009",
    "类型": "阶段交接",
    "来源角色": "cognis_tester",
    "目标角色": "实现负责人",
    "Agent/运行收据": "native-cognis_tester-final-20260730-c",
    "状态": "已返回",
    "变更集指纹": "4d294a3f1fd214aa07a7ee4ae2faae74254db0be0aaabb03dd882ccfcc2e18d1",
    "已完成": ["Tester 结论：通过", "AC-01 至 AC-06 全部核验通过", "22 个 Pencil 资产哈希匹配"],
    "未完成": [],
    "验证证据": ["--check-generated 退出码 0", "git diff --check 退出码 0", "design/cnas-validation-report.json 11/11 通过、232 页"],
    "未验证项": ["按并发约束未重新运行 Pencil CLI", "任务不要求点击热点原型"],
    "风险": ["未发现实际失败项"],
    "下一步": "由主 Agent 执行 fan-in 集成验证",
    "恢复提示": "以 Tester 通过收据继续集成验证",
    "时间": "2026-07-30"
  },
  {
    "版本": 1,
    "编号": "H-010",
    "类型": "阶段交接",
    "来源角色": "cognis_reviewer",
    "目标角色": "实现负责人",
    "Agent/运行收据": "native-cognis_reviewer-final-20260730-c",
    "状态": "已返回",
    "变更集指纹": "4d294a3f1fd214aa07a7ee4ae2faae74254db0be0aaabb03dd882ccfcc2e18d1",
    "已完成": ["Reviewer 结论：批准", "首轮五项 findings 与校验器绕过点闭合", "无 Critical、High 或 Medium finding"],
    "未完成": [],
    "验证证据": ["232 页、96 个隐藏页、956 个动作独立解析", "155 个 renderFamily 页面双步骤器核验", "22 个 Pencil 资产哈希与尺寸匹配"],
    "未验证项": ["未逐张以原始分辨率人工复核全部预览"],
    "风险": ["布局结论依赖冻结指纹对应的结构报告，已通过哈希与尺寸确认同步"],
    "下一步": "由主 Agent 执行 fan-in 集成验证并交付",
    "恢复提示": "以 Reviewer 批准收据继续集成验证",
    "时间": "2026-07-30"
  }
]
```

## 验收证据

| AC-ID | 证据类型 | 命令或产物 | 退出码 | 核验时间 | 核验者 | 实际结果 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | Pencil 结构校验 | `node scripts/generate-cnas-pencil-designs.mjs --validate-existing --write-validation-report` | 0 | 2026-07-31 | 实现负责人 | 模块 Contact Sheet 问题为 0；设计系统 7 个规范区保留。 |
| AC-02 | 规格与动作断言 | `node scripts/generate-cnas-pencil-designs.mjs --check-generated` | 0 | 2026-07-31 | 实现负责人 | 232 页、96 个隐藏操作页；动作形态和目标断言通过。 |
| AC-03 | 页面地图与产物抽查 | `design/cnas-page-map.md`、模块 04/06 PNG | 0 | 2026-07-31 | 实现负责人 | `TM01-CREATE`、`TM03`、`R23-CREATE`、`R23-DETAIL` 均存在并可反查。 |
| AC-04 | 双步骤器结构断言 | 10 个 `.pen` 的 155 个 `renderFamily` 页面 | 0 | 2026-07-31 | 实现负责人 | 每页恰好 1 个主流程步骤器和 1 个局部步骤器；`SM06=4`、`SM08=6`。 |
| AC-05 | 流程路由与禁用态断言 | P07 页面地图、`GOV08.完成归档` 控件状态 | 0 | 2026-07-31 | 实现负责人 | 七节点链路通过；签收/回收未完成时归档按钮禁用并显示原因。 |
| AC-06 | 全量结构校验 | `--validate-existing --write-validation-report` | 0 | 2026-07-31 | 实现负责人 | 11/11 资产通过、232 页、布局/导航/顶层画板问题均为 0。 |
| AC-06 | Git 静态检查 | `git diff --check` | 0 | 2026-07-31 | 实现负责人 | 无空白错误，仅 Git 行尾转换提示。 |
| AC-06 | 产物指纹 | `node scripts/generate-cnas-pencil-designs.mjs --fingerprint` | 0 | 2026-07-30 | 实现负责人 | `4d294a3f1fd214aa07a7ee4ae2faae74254db0be0aaabb03dd882ccfcc2e18d1`。 |
| AC-01 至 AC-06 | 独立 Tester | 只读验收与静态反证 | 0 | 2026-07-30 | cognis_tester | 通过；22 个 Pencil 资产哈希匹配。 |
| AC-01 至 AC-06 | 独立 Reviewer / Red Team | findings-first 审查与校验器绕过反证 | 0 | 2026-07-30 | cognis_reviewer | 批准；无 Critical、High 或 Medium finding。 |

## 剩余风险

Tester 与 Reviewer 均未逐张以原始分辨率人工复核全部预览；主 Agent 已抽查模块 04、06、08 的最终 PNG。Pencil CLI 使用共享 IPC，后续若重新生成资产必须保持串行并重新执行独立核验。
