# CNAS-PROTOTYPE-002 红队测试报告 · 主流程原型 P01-P04

## 审查范围

- 原型路径：`prototype/main-flow/`（ES Module 架构，无构建工具，浏览器原生 import）
- 覆盖流程：P01 客户与委托受理、P02 样品生命周期、P03 检测执行与结果放行、P04 报告编制发布与归档
- 核心模块：集中式状态机（`src/flow/state-machine.js`）、CRUD 仓库（`src/data/repository.js`）、状态容器（`src/state/store.js`）、四个页面模块（customer/sample/testing/report）、事件委托入口（`src/app.js`）
- 测试方式：Playwright headless Chromium 驱动真实浏览器，主动构造攻击场景（非法状态转换、权限绕过、数据隔离、上下文残留、边界条件）

## 测试套件

| 套件 | 文件 | 用例数 | 结果 |
| --- | --- | --- | --- |
| 基线交互测试 | `tests/interaction-test.mjs` | 26 | ✅ 26/26 通过 |
| 红队全流程回归 | `tests/redteam-full-regression.mjs` | 25 | ✅ 全部通过 |
| CC06 端到端流程 | `tests/e2e-cc06-flow.mjs` | 16 | ✅ 全部通过 |
| 红队攻击测试 | `tests/red-team-attack.mjs` | 29 | ✅ 29/29 SAFE |

## 发现的漏洞与修复

### V1. impact 前置条件全部失效（Critical）

**编号**：FR-CONTRACT-005 / FR-SAMPLE-005 / FR-RECORD-005

**现象**：状态机多处前置条件依赖 `ctx.impact`（`hasPublishedReport`、`hasLegalHold`、`hasPendingTask`、`hasUnclosedException`），但所有页面调用 `execute()` 时均未传 `impact` 字段。可选链 `ctx.impact?.xxx` 在 `impact` 为 `undefined` 时短路返回 `undefined`（falsy），条件恒不触发。

**攻击验证**：
- 对有已发布报告的委托 `cm1` 发起变更 → 变更成功（应被 FR-CONTRACT-005 阻断）
- 对有未完成任务的样品执行处置 → 处置成功（应被 FR-SAMPLE-005 阻断）
- 对存在未处理异常的任务提交复核 → 提交成功（应被 FR-RECORD-005 阻断）

**修复**：
- `src/pages/customer.js`：CC05 和 CC08 变更评审计算 `hasPublishedReport` 并传入 `impact`
- `src/pages/sample.js`：新增 `computeSampleImpact()` 计算法律冻结/未完成任务，SM05 和 SM12 处置传入 `impact`
- `src/pages/testing.js`：新增 `computeTaskImpact()` 计算未关闭异常，TM03、TM05 提交复核、TM12 复核通过传入 `impact`
- `src/pages/testing.js`：TM09 恢复执行时清空 `exceptionFlag`，使异常真正关闭

**修复后验证**：有已发布报告的委托变更被正确阻断（Toast: "存在已发布报告，必须完成影响评价后才可生效 [FR-CONTRACT-005]"）

### V2. availableActions 不按角色过滤（High）

**现象**：`availableActions()` 只按 `from` 状态过滤，不检查 `roles`。CC05/SM05/TM03/RM08 用它生成按钮，导致无权角色也看到操作按钮（点击后才报权限不足）。

**攻击验证**：检测员查看 CC05 委托详情时看到"发起变更"按钮（仅业务受理人员/技术负责人有权）。

**修复**：
- `src/flow/state-machine.js`：`availableActions(objectType, item, options)` 增加 `options.role` 和 `options.skipPreconditions` 参数，默认用 `getSession().role` 按角色和前置条件过滤
- `src/flow/state-machine.js`：`canExecute()` 修复空 `from` 数组处理（与 `execute` 一致）

**修复后验证**：检测员不再看到委托变更按钮（按钮已按角色过滤）

### V3. remove 无业务事实保护（High）

**现象**：`repository.js` 的 `remove()` 注释写明"仅限未形成业务事实的对象"，但代码不校验状态和关联对象，直接 `splice` 删除。删除已关联样品/任务的委托会产生悬挂引用。

**攻击验证**：删除 `cm1`（已关联 2 个样品、2 个任务、1 个报告）成功，留下 2 个孤儿样品（`commissionCode` 指向已删除委托）。

**修复**：
- `src/data/repository.js`：新增 `checkRemovable()` 检查对象是否已离开初始状态或存在下游关联对象
- 委托：检查关联样品/任务/报告；样品：检查关联任务；任务：检查关联记录
- 非初始状态或有关联时拒绝删除并写审计

**修复后验证**：删除已关联样品的委托被拒绝（返回 null，审计记录"删除委托被拒"）

### V4. 职责分离校验角色源不一致（High）

**现象**：`execute()` 的角色权限检查用 `context.role || getSession().role`，但 `approve` 和 RECORD `review-pass` 的前置条件用 `getSession().role` 做职责分离校验。两者角色源不一致，当 `context.role` 与 session 角色不同时，职责分离校验可被绕过。

**攻击验证**：session 角色为"检测员"时，传入 `context.role='技术负责人'` 对 `owner='技术负责人'` 的委托执行 approve → 成功（应被职责分离阻断）。

**修复**：
- `src/flow/state-machine.js`：`approve` 和 RECORD `review-pass` 前置条件统一用 `ctx.role || getSession().role`

**修复后验证**：自审批被正确阻断（"审批人与登记人职责分离校验未通过"）

### V5. ID 碰撞风险（Medium）

**现象**：`makeId()` 用 `existing.length + 1` 生成序号，删除后 `length` 减小，重建会与已删除记录的序号重叠。后缀仅 4 位 36 进制，同一毫秒内创建+删除+再创建会完全碰撞。

**攻击验证**：创建客户 A、B，删除 B，再创建 C → C 的 ID 与 B 相同（`cus2-rchy`）。

**修复**：
- `src/data/repository.js`：`makeId()` 改为从已有 ID 提取最大序号 +1（而非 `length+1`），后缀扩展为 6 位时间戳 + 2 位随机数

**修复后验证**：删除后重建 ID 唯一，不碰撞

## 未修复的已知设计限制

以下问题经评估为原型阶段可接受的设计限制，不构成阻断，建议在后续迭代中处理：

| 编号 | 问题 | 影响 | 建议 |
| --- | --- | --- | --- |
| D1 | TM07/TM08/TM11/TM13 四个页面无 UI 入口（孤儿页面） | 用户无法通过导航到达，但页面可渲染 | 后续在 TM03/TM05 增加导航按钮 |
| D2 | TM13 质控放行/TM14 完成归档不走状态机（只 toast） | 任务状态不真正变为归档态 | 后续为 TASK 增加 archive 转换规则 |
| D3 | currentContextId 跨页面不清除（列表/侧栏导航后残留） | 详情页可能用残留 ID 查到空状态（安全），但语义不严谨 | 列表/侧栏导航时清空 currentContextId |
| D4 | 审计日志 >100 条截断 | 合规场景应永久保留 | 后续改为不截断或分页持久化 |
| D5 | 审计日志 actor 记录角色名而非人员姓名 | 同角色多人操作无法区分 | 后续引入人员 ID |
| D6 | filterBar 搜索/筛选未接线 | 筛选条无实际效果 | 后续接入 data-filter 监听 |
| D7 | CC09 客户沟通、SM07 分样、TM06 仪器导入为演示桩 | 数据不持久化 | 后续按需求实现 |
| D8 | 委托 reject 后"已拒绝"状态无恢复路径 | 退回补充的委托无法回到草稿 | 需求确认是否 reject 应落到"草稿"而非"已拒绝" |

## 测试覆盖矩阵

### 权限边界测试（5 项，全部 SAFE）

| 测试 | 结果 |
| --- | --- |
| 检测员不能签发报告 | ✅ 被拒（要求角色: 授权签字人） |
| 样品管理员不能提交任务复核 | ✅ 被拒（要求角色: 检测员） |
| 业务受理人员不能接收样品 | ✅ 被拒（要求角色: 样品管理员） |
| 审批人≠登记人职责分离 | ✅ 被拒（职责分离校验未通过） |
| 执行人≠复核人职责分离 | ✅ 被拒（要求角色: 复核人/技术负责人） |

### 非法状态转换测试（3 项，全部 SAFE）

| 测试 | 结果 |
| --- | --- |
| 草稿报告不能直接发布 | ✅ 阻断（要求状态: 已签发） |
| 待接收样品不能直接处置 | ✅ 阻断（要求状态: 留样中/已归还） |
| 待排程任务不能直接提交复核 | ✅ 阻断（要求状态: 执行中） |

### 数据隔离测试（全部 SAFE）

| 测试 | 结果 |
| --- | --- |
| 样品-委托关联不串扰 | ✅ SMP-0001/0002→COMM-2026-0001, SMP-0003→COMM-2026-0002 |
| 任务-样品关联不串扰 | ✅ TASK-0001→SMP-0001, TASK-0002→SMP-0002 |
| 所有集合保持数组结构 | ✅ 7 个集合均为数组 |

### 上下文残留测试（全部 SAFE）

| 测试 | 结果 |
| --- | --- |
| 委托 ID 残留到样品页 | ✅ 显示空状态（安全） |
| 角色切换清除 context | ✅ logout→login 后 currentContextId=undefined |

### 审计日志完整性（全部 SAFE）

| 测试 | 结果 |
| --- | --- |
| 审计日志字段完整 | ✅ 5/5 条含 time/actor/action/detail |
| 审计日志截断行为 | ⚠️ >100 条截断（已知设计限制 D4） |

### 页面错误（SAFE）

| 测试 | 结果 |
| --- | --- |
| 红队测试期间无页面异常 | ✅ 0 个 pageerror |

## 验证命令

```bash
# 启动本地静态服务器（端口 8090）
npx http-server prototype/main-flow -p 8090

# 安装 Playwright
npm install playwright --no-save
npx playwright install chromium

# 运行全部测试套件
node tests/interaction-test.mjs          # 基线交互（26 项）
node tests/redteam-full-regression.mjs   # 红队回归（25 项）
node tests/e2e-cc06-flow.mjs             # CC06 端到端（16 项）
node tests/red-team-attack.mjs           # 红队攻击（29 项）
```

## 审查结论

**批准**。5 项确认漏洞（1 Critical / 3 High / 1 Medium）已全部修复并通过红队攻击测试复验。29 项攻击测试全部 SAFE，0 漏洞残留。8 项已知设计限制已记录，均为原型阶段可接受范围，不构成批准阻挡。

数据流转正常（状态机转换、CRUD 操作、审计留痕均验证通过），页面状态正常（各页面渲染、权限校验、动态按钮均验证通过），数据互不干扰（跨委托/样品/任务关联隔离验证通过）。
