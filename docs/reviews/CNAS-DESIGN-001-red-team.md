# CNAS-DESIGN-001 红队审查包

## 审查对象

- `design/cnas-01-foundation-workbench.pen/.png`
- `design/cnas-02-business-chain.pen/.png`
- `design/cnas-03-resources-quality.pen/.png`
- `design/cnas-04-governance-accreditation.pen/.png`
- `design/cnas-page-map.md`
- `design/cnas-validation-report.json`
- `scripts/generate-cnas-pencil-designs.mjs`

## 审查目标

独立检查页面范围、业务语义、角色权限、异常与审计状态、web-ele 组件映射、Pencil 结构完整性、预览一致性以及自动验收是否存在弱断言或误报。

## 必查风险

- 页面总数或领域分组与批准计划不一致。
- 桌面或移动画板尺寸错误，文本、按钮、表格或流程节点被裁切。
- 页面只覆盖正常路径，缺少异常、退回、阻断、权限和审计状态。
- 使用真实敏感数据、未经核验的证书号或标准编号。
- `.pen` 与同名 PNG 语义不一致，或存在无预览的临时 `.pen`。
- 生成器直接文本修改 `.pen`，绕过 Pencil/pen.dev 工具链。
- 自动校验通过但没有真正检查页面编号、尺寸、组件和布局问题。
- 页面映射遗漏 12 条核心流程、关键角色或一级需求模块。

## 冻结变更集

冻结指纹和 Reviewer 收据记录在 `docs/tasks/CNAS-DESIGN-001.md` 的交接记录中。

## 审查结论

结论：要求修改。

- High：B11、B12、B15、M05、G04、G07 等关键页面过度复用通用模板，未充分表达业务专属布局、职责分离和阻断状态。
- High：13 个可复用组件仅存在于组件区，业务页面没有实际 `ref` 实例，验收仅统计组件定义导致假阳性。
- High：治理校验未通过，任务控制与 Handoff 字段需要按 schema 整改。
- 整改要求：补齐专属页面、组件实例和语义断言，修复治理门禁后以新冻结指纹重新核验。
