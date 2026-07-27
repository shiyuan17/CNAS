<!-- COGNIS:START -->
# AGENTS.md

项目：CNAS

## 启动

1. 阅读 `docs/rules/governance-core.md`、`docs/rules/AGENT_SKILL_ROUTING.md` 和命中场景的专项规则。
2. 编辑前运行 `git status --short`，保护用户未归属改动。
3. 若 `codebase-memory-mcp` 可用，先确认索引状态并用于结构化定位；不可用时说明并退回仓库搜索。
4. 将任务归为快速、轻量或完整，并确定验证方式。
5. 当前运行 Workflow 为 `adaptive`；adaptive 默认直接执行结果优先主循环，strict 保留完整生命周期。已安装 Skills 由宿主按 description 原生选择，不使用 Router 或流程 Skill 链。

## 硬边界摘要

- 只在授权范围内行动；红区、不可逆操作和范围扩大先获人工确认。
- 不编造事实或证据，没有本轮验证证据不声称完成；详细门禁以治理内核为唯一真值。
- adaptive 不要求通用任务确认或固定 11 字段交付；strict 的轻量反证及完整任务的任务确认、审查和交付字段以治理内核与模板为准。

## 默认验证命令

- Lint: 未配置
- Typecheck: 未配置
- Governance: node .agents/cognis/governance/validate.mjs。`cognis validate --project` 只检查安装一致性；执行项目命令使用 `cognis verify --project <path>`；manual 和测试范围细则见治理内核及 `docs/rules/test-rules.md`。

## 已安装表面

- 当前安装方式：完整治理安装（包含七个原生 Skills 和 Codex hooks；memory 与外部工具仅通过 `--plugin` 显式启用）。
- codebase-memory-mcp 规则位于 `docs/rules/codebase-memory-mcp.md`。
- 规则位于 `docs/rules/`。
- 工程专项规则位于 `docs/rules/`。
- 发布 / 设计 / 排障规则位于 `docs/rules/`。
- 模板位于 `docs/templates/`。
- Skills 位于 `.agents/skills/`。
- Codex full 已安装 `cognis_tester` 与 `cognis_reviewer`。轻量行为改动在冻结变更集后派发 Tester；完整或高风险任务并行派发 Tester 与 Reviewer，等待两者回传并写入同一任务 Markdown 的 Handoff。核验期间主 Agent 不得修改变更集；任何后续 Git 可见实现改动都要求重新派发。父 Agent 必须检查实际 diff，并在 fan-in 后重跑集成验证。
- agentmemory skills 位于 `.agents/skills/`，本地记忆库位于 `.agents/memory/`。
- Codex hook 配置位于 `.codex/hooks.json`。
- 项目内工具位于 `.agents/cognis/tools/`；使用 `cognis doctor --project <path>` 查看初始化状态。 Chrome DevTools MCP 规则位于 `docs/rules/chrome-devtools-mcp.md`。 RTK 规则位于 `docs/rules/rtk.md`。 ast-grep 规则位于 `docs/rules/ast-grep.md`。
宿主按 Skill description 原生选择一个当前阶段所需能力；不使用 Router 或流程 Skill 链。

规则优先级：平台系统与用户本轮指令优先；目标项目明确的本地规则优先于 Cognis 默认规则；目录级规则只作用于其子树。同一层级冲突时停止并请求确认。
<!-- COGNIS:END -->
