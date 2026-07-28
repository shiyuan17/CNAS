# CNAS-REQ-002 CNAS LIMS 需求规格候选基线

- 工作流档位：完整
- 当前阶段：交付
- 当前状态：空闲
- 处理结果：重复

## 后续替代

本任务已于第五轮独立核验时完成候选 SRS 0.9 的阶段性验收。`CNAS-REQ-003` 在该候选包上继续建立正式业务与开发基线准备产物，并修改了本任务曾冻结的需求文件，因此本任务的旧变更集指纹只保留为历史证据，不再代表当前工作区。当前成果及后续核验由 `CNAS-REQ-003` 接管；不得把本任务旧收据改写为新版本核验结果。

## 目标

将现有需求框架重构为覆盖检测与校准两类业务、可评审、可测试、可追溯的候选 SRS 包；在缺少实际制度、表单、案例和业务签署证据时，保持正式基线门禁为阻塞，不把标准推导写成已确认业务事实。

## 验收标准

| AC-ID | 标准 |
| --- | --- |
| AC-01 | 产物明确冻结检测与校准双业务范围，排除 ISO 15189 和病理扩展，并声明原型为非权威参考。 |
| AC-02 | 资料、标准、推测、最佳实践和待确认内容均有来源等级与追踪规则。 |
| AC-03 | 共享质量核心、检测链和校准链分别建模，核心流程包含正常、异常、撤回、退回、作废、更正和接口失败控制。 |
| AC-04 | 原子化 FR、RULE、NFR、INT、RPT 均具备角色、条件、状态、权限、审计和可验收表达。 |
| AC-05 | 角色权限、职责分离、核心数据实体、状态规则、数据完整性、报告/证书和电子签名控制得到专项定义。 |
| AC-06 | P0 需求可双向追踪到来源、控制措施、保留记录和验收场景；无证据项不得标记为已确认。 |
| AC-07 | 待确认项包含责任角色、计划节点、影响范围和阻塞级别；正式基线批准条件明确。 |
| AC-08 | 项目治理校验通过，且冻结变更集获得独立 Tester 与 Reviewer 的有效结论。 |

## 验证计划

- 检查 Markdown 结构、唯一需求编号、标记使用、Mermaid 代码块和内部链接。
- 统计 P0 需求、验收场景及追踪关系，验证不存在孤立 P0。
- 运行 `node .agents/cognis/governance/validate.mjs`。
- 使用 `node --input-type=module -e "import { computeWorkspaceFingerprint } from './.agents/cognis/hooks/lib/subagent-receipts.mjs'; console.log(await computeWorkspaceFingerprint(process.cwd()));"` 生成并复核冻结指纹；该算法按项目规则排除 `.cognis/`、`docs/tasks/` 和 `docs/reviews/`，但包含其他 Git 可见用户改动。
- 冻结 Git 可见变更集后，派发 `cognis_tester` 与 `cognis_reviewer` 并行只读核验。
- Fan-in 后由主 Agent 检查实际 diff 并重跑集成验证。

## 上下文缓存边界

- 稳定前缀：治理内核、适用专项规则、文档标记约定、需求编号体系和 SRS 版本规则。
- 动态后缀：当前资料版本、标准网页核验结果、工作区状态、待确认项、核验收据和变更集指纹。
- 原始 DOCX/PDF、审查报告和批准的范围决策为输入；现有页面地图与原型仅用于后续差异核对，不作为业务事实。

## 下一步动作

候选 SRS 包已完成第五轮独立 Tester、Reviewer 与主 Agent fan-in 集成复验。下一阶段应按证据台账关闭 E1 资料和 25 项 TBD，完成四方联合签署后，方可建立正式业务/开发基线并启动原型校准。

## 完整流程控制

```json
{
  "控制版本": 3,
  "任务类型": "单任务",
  "集成验证": [
    "node .agents/cognis/governance/validate.mjs",
    "需求包结构与追踪一致性检查"
  ],
  "责任角色": "实现负责人",
  "写入范围": [
    "docs/requirements/**",
    "docs/analysis/cnas-lims-requirements-framework.md",
    "docs/tasks/CNAS-REQ-002.md",
    "docs/reviews/CNAS-REQ-002-red-team.md",
    "docs/reviews/CNAS-REQ-002-tester.md"
  ],
  "禁止动作": [
    "覆盖用户未归属改动",
    "修改或恢复 design/ 与 html_design/ 原型文件",
    "把标准推导或最佳实践标记为已确认业务需求",
    "在无签署证据时声明正式基线获批"
  ],
  "输入": [
    "docs/demand/CNAS信息管理系统V2.docx",
    "docs/demand/标准化智慧实验室管理平台（软件）V2.0.pdf",
    "docs/analysis/cnas-lims-requirements-framework.md",
    "docs/reviews/CNAS-REQ-001-requirements-review.md"
  ],
  "输出格式": [
    "候选 SRS 主文档",
    "详细需求目录",
    "证据与待确认台账",
    "需求追踪与验收矩阵",
    "独立核验记录"
  ],
  "不得修改范围": [
    "写入范围之外的所有文件"
  ],
  "依赖任务": [],
  "冲突任务": [],
  "并行安全": "独占写入",
  "时间盒分钟": 480,
  "停止条件": "候选 SRS 包满足 AC-01 至 AC-08；正式批准仍受业务证据和联合签署门禁约束",
  "回滚方案": "删除本任务新增产物并恢复框架文件本次改动；不触碰用户原型改动",
  "人工确认": "已确认",
  "核验者": "cognis_tester",
  "红队审查者": "cognis_reviewer",
  "红队审查包": "docs/reviews/CNAS-REQ-002-red-team.md",
  "红队审查结论": "批准",
  "独立核验模式": "人工等价",
  "人工等价核验": [
    {
      "角色": "cognis_tester",
      "核验者": "019fa660-5de5-7a90-b818-60644eef2f5c",
      "证据": "docs/reviews/CNAS-REQ-002-tester.md",
      "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
      "结论": "通过",
      "时间": "2026-07-28T09:58:20+08:00"
    },
    {
      "角色": "cognis_reviewer",
      "核验者": "019fa660-6cb1-7f22-b753-0ae284b6e8af",
      "证据": "docs/reviews/CNAS-REQ-002-red-team.md",
      "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
      "结论": "批准",
      "时间": "2026-07-28T09:58:21+08:00"
    }
  ],
  "合并回主线状态": "不需要"
}
```

## 交接记录

```json
[
  {
    "版本": 1,
    "编号": "CNAS-REQ-002-TESTER-R5",
    "类型": "子任务回传",
    "来源角色": "cognis_tester",
    "目标角色": "实现负责人",
    "Agent/运行收据": "docs/reviews/CNAS-REQ-002-tester.md",
    "状态": "待接收",
    "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
    "已完成": ["第五轮独立只读验收已执行"],
    "未完成": ["等待主 Agent 接收核验结果"],
    "验证证据": ["161 条需求、129 条 P0、129 条映射、151 条 TC、25 条 TBD"],
    "未验证项": ["E1 业务证据、业务联合签署和系统运行行为"],
    "风险": ["候选包不得被误标为正式业务基线"],
    "下一步": "主 Agent 接收 Tester 结论",
    "恢复提示": "读取 Tester 核验记录并核对冻结指纹",
    "时间": "2026-07-28T09:58:00+08:00"
  },
  {
    "版本": 1,
    "编号": "CNAS-REQ-002-TESTER-R5",
    "类型": "子任务回传",
    "来源角色": "cognis_tester",
    "目标角色": "实现负责人",
    "Agent/运行收据": "docs/reviews/CNAS-REQ-002-tester.md",
    "状态": "已接收",
    "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
    "已完成": ["主 Agent 已接收第五轮 Tester 只读核验结果"],
    "未完成": ["等待 Tester 完成回传"],
    "验证证据": ["核验者身份和冻结指纹已核对"],
    "未验证项": ["fan-in 后集成验证尚未执行"],
    "风险": ["后续 Git 可见候选包改动将使结论失效"],
    "下一步": "登记 Tester 最终回传",
    "恢复提示": "核对 Tester 结论、证据路径和变更集指纹",
    "时间": "2026-07-28T09:58:10+08:00"
  },
  {
    "版本": 1,
    "编号": "CNAS-REQ-002-TESTER-R5",
    "类型": "子任务回传",
    "来源角色": "cognis_tester",
    "目标角色": "实现负责人",
    "Agent/运行收据": "docs/reviews/CNAS-REQ-002-tester.md",
    "状态": "已返回",
    "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
    "已完成": ["AC-01 至 AC-08 全部通过", "Tester 结论已持久化"],
    "未完成": ["等待主 Agent fan-in 集成验证"],
    "验证证据": ["docs/reviews/CNAS-REQ-002-tester.md"],
    "未验证项": ["E1 业务证据、业务联合签署和系统运行行为"],
    "风险": ["25 项 TBD 与 RULE-008 仍受正式批准门禁控制"],
    "下一步": "与 Reviewer 结论共同进入 fan-in",
    "恢复提示": "使用冻结指纹执行主 Agent 集成复验",
    "时间": "2026-07-28T09:58:20+08:00"
  },
  {
    "版本": 1,
    "编号": "CNAS-REQ-002-REVIEWER-R5",
    "类型": "子任务回传",
    "来源角色": "cognis_reviewer",
    "目标角色": "实现负责人",
    "Agent/运行收据": "docs/reviews/CNAS-REQ-002-red-team.md",
    "状态": "待接收",
    "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
    "已完成": ["第五轮独立 findings-first 与 Red Team 审查已执行"],
    "未完成": ["等待主 Agent 接收审查结果"],
    "验证证据": ["无 Critical、High 或未处置 Medium"],
    "未验证项": ["E1 业务证据、业务联合签署和实现级运行测试"],
    "风险": ["正式业务基线门禁仍未解除"],
    "下一步": "主 Agent 接收 Reviewer 结论",
    "恢复提示": "读取 Red Team 审查包并核对冻结指纹",
    "时间": "2026-07-28T09:58:01+08:00"
  },
  {
    "版本": 1,
    "编号": "CNAS-REQ-002-REVIEWER-R5",
    "类型": "子任务回传",
    "来源角色": "cognis_reviewer",
    "目标角色": "实现负责人",
    "Agent/运行收据": "docs/reviews/CNAS-REQ-002-red-team.md",
    "状态": "已接收",
    "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
    "已完成": ["主 Agent 已接收第五轮 Reviewer 只读审查结果"],
    "未完成": ["等待 Reviewer 完成回传"],
    "验证证据": ["核验者身份、审查结论和冻结指纹已核对"],
    "未验证项": ["fan-in 后集成验证尚未执行"],
    "风险": ["后续 Git 可见候选包改动将使结论失效"],
    "下一步": "登记 Reviewer 最终回传",
    "恢复提示": "核对 Reviewer 结论、证据路径和变更集指纹",
    "时间": "2026-07-28T09:58:11+08:00"
  },
  {
    "版本": 1,
    "编号": "CNAS-REQ-002-REVIEWER-R5",
    "类型": "子任务回传",
    "来源角色": "cognis_reviewer",
    "目标角色": "实现负责人",
    "Agent/运行收据": "docs/reviews/CNAS-REQ-002-red-team.md",
    "状态": "已返回",
    "变更集指纹": "d0b57a067d77859621740c3e1810eaafe2fb50b15ea15b86bb571514ea11d560",
    "已完成": ["候选包审查结论为批准", "Reviewer 结论已持久化"],
    "未完成": ["等待主 Agent fan-in 集成验证"],
    "验证证据": ["docs/reviews/CNAS-REQ-002-red-team.md"],
    "未验证项": ["E1 业务证据、业务联合签署和实现级运行测试"],
    "风险": ["候选批准不得解释为正式开发基线批准"],
    "下一步": "与 Tester 结论共同进入 fan-in",
    "恢复提示": "使用冻结指纹执行主 Agent 集成复验",
    "时间": "2026-07-28T09:58:21+08:00"
  }
]
```

## 验收证据

| AC-ID | 证据类型 | 命令或产物 | 退出码 | 核验时间 | 核验者 | 实际结果 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | 产物 | docs/requirements/cnas-lims-srs.md | 不适用 | 2026-07-28T10:02:30+08:00 | 实现负责人 | SRS 明确检测/校准双业务范围、排除 ISO 15189/病理，并声明原型非权威。 |
| AC-02 | 产物 | docs/requirements/cnas-lims-evidence-register.md | 不适用 | 2026-07-28T10:02:31+08:00 | 实现负责人 | E1-E4 来源等级、标记规则、证据哈希和变更门禁已定义。 |
| AC-03 | 产物 | docs/requirements/cnas-lims-srs.md | 不适用 | 2026-07-28T10:02:32+08:00 | 实现负责人 | 共享质量核心、检测链和校准链分离，17 张图覆盖核心正常及异常闭环。 |
| AC-04 | 产物 | docs/requirements/cnas-lims-requirement-catalog.md | 不适用 | 2026-07-28T10:02:33+08:00 | 实现负责人 | 161 条原子需求采用统一字段并包含可验收表达。 |
| AC-05 | 产物 | docs/requirements/cnas-lims-srs.md | 不适用 | 2026-07-28T10:02:34+08:00 | 实现负责人 | 角色权限、职责分离、实体、状态、签名、审计和报告证书控制已专项定义。 |
| AC-06 | 产物 | docs/requirements/cnas-lims-traceability-matrix.md | 不适用 | 2026-07-28T10:02:35+08:00 | 实现负责人 | 129 条候选 P0 均有逐条映射，关联 151 条已定义 TC，集合差异为 0。 |
| AC-07 | 产物 | docs/requirements/cnas-lims-evidence-register.md | 不适用 | 2026-07-28T10:02:36+08:00 | 实现负责人 | 25 项 TBD 均含责任角色、计划节点、影响范围和阻塞级别，正式批准门禁明确。 |
| AC-08 | 审查 | docs/reviews/CNAS-REQ-002-tester.md | 不适用 | 2026-07-28T10:02:37+08:00 | cognis_tester | 第五轮独立 Tester 结论为通过，AC-01 至 AC-08 全部通过。 |
| AC-08 | 审查 | docs/reviews/CNAS-REQ-002-red-team.md | 不适用 | 2026-07-28T10:02:38+08:00 | cognis_reviewer | 第五轮 Reviewer 结论为批准，无 Critical、High 或未处置 Medium。 |
| AC-08 | 命令 | 需求包结构与追踪一致性检查 | 0 | 2026-07-28T10:03:30+08:00 | 实现负责人 | requirements=161，p0=129，mappings=129，tc=151，tbd=25，mermaid=17；无缺失映射、孤立映射或失效 TC。 |
| AC-08 | 命令 | node .agents/cognis/governance/validate.mjs | 0 | 2026-07-28T10:03:45+08:00 | 实现负责人 | 治理校验通过。 |

## 剩余风险

- 缺少项目实际质量手册、程序文件、表单、脱敏案例和接口台账，候选需求仍需业务逐域确认。
- 认可领域及对应应用说明未确定，领域专用要求不能进入当前通用基线。
- 业务量、并发、保存期限、RPO/RTO 和签名方式未确认，相关指标保持待确认。
