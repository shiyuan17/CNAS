# CNAS-DESIGN-002 CNAS LIMS 十分卷页面体系重构

- 工作流档位：完整
- 当前阶段：执行
- 当前状态：进行中
- 处理结果：开放

## 目标

将 CNAS LIMS Pencil 页面体系重构为 10 个业务分卷，交付 130 个桌面页与 6 个移动页。统一修复按钮文字居中，移除“当前模块”“演示数据”“全部用户”“DEMO”等无效可见标识，并建立“一级业务模块 → 二级功能入口 → 隐藏操作页”的导航层级。最终业务设计交付物仅包含可编辑 `.pen`、同名 `.png` 预览和页面地图。

## 非目标

- 不实现或修改前端页面、路由、交互逻辑、接口、数据库、权限引擎或部署配置。
- 不把 Pencil 设计稿解释为已实现的业务规则、数据契约或可运行系统。
- 不修改前端、接口、数据库、路由、部署配置或治理工具；生成器与页面规格脚本仅在本轮页面体系重构范围内调整。
- 不使用真实生产数据、真实个人信息、真实证书号、secret 或机器专属绝对路径。
- 不直接以文本方式编辑 `.pen`，不以截图替代可编辑 Pencil 源文件。

## 范围

| 分卷 | 一级模块 | 桌面页 | 移动页 | 交付文件 |
| --- | --- | ---: | ---: | --- |
| 01 | 工作台 | 7 | 2 | `design/cnas-01-workbench.pen`、`design/cnas-01-workbench.png` |
| 02 | 客户与委托 | 9 | 0 | `design/cnas-02-customer-commission.pen`、`design/cnas-02-customer-commission.png` |
| 03 | 样品管理 | 12 | 1 | `design/cnas-03-sample-management.pen`、`design/cnas-03-sample-management.png` |
| 04 | 检测管理 | 14 | 1 | `design/cnas-04-testing-management.pen`、`design/cnas-04-testing-management.png` |
| 05 | 报告管理 | 11 | 1 | `design/cnas-05-report-management.pen`、`design/cnas-05-report-management.png` |
| 06 | 资源管理 | 26 | 1 | `design/cnas-06-resource-management.pen`、`design/cnas-06-resource-management.png` |
| 07 | 质量管理 | 12 | 0 | `design/cnas-07-quality-management.pen`、`design/cnas-07-quality-management.png` |
| 08 | 体系管理 | 15 | 0 | `design/cnas-08-governance-management.pen`、`design/cnas-08-governance-management.png` |
| 09 | 认可管理 | 8 | 0 | `design/cnas-09-accreditation-management.pen`、`design/cnas-09-accreditation-management.png` |
| 10 | 系统管理 | 16 | 0 | `design/cnas-10-system-management.pen`、`design/cnas-10-system-management.png` |

页面地图交付为 `design/cnas-page-map.md`。`docs/tasks/CNAS-DESIGN-002.md`、`docs/reviews/CNAS-DESIGN-002-red-team.md` 与 `design/cnas-validation-report.json` 仅承载治理和验证证据，不属于业务设计交付物。

## 验收标准

| AC-ID | 标准 |
| --- | --- |
| AC-01 | 10 个业务分卷均存在可由受支持 Pencil 工具重新打开的 `.pen`，并有同目录、同 basename 的 `.png` 预览；不保留旧四分卷交付物或临时导出文件。 |
| AC-02 | 页面总数精确为 136，其中桌面页 130、移动页 6；各分卷桌面/移动数量依次为 `7/2`、`9/0`、`12/1`、`14/1`、`11/1`、`26/1`、`12/0`、`15/0`、`8/0`、`16/0`，页面编号唯一。 |
| AC-03 | 桌面画板为 `1440x900`，移动画板为 `390x844`；全部按钮及禁用按钮文字在稳定尺寸容器内水平、垂直居中，长文本不导致控件或相邻内容重叠、裁切或越界。 |
| AC-04 | 所有页面的可见文字中不存在“当前模块”“演示数据”“演示环境”“全部用户”“DEMO”“（演示）”及等价的无业务价值装饰标识；虚构数据仍不得被替换为真实生产或个人数据。 |
| AC-05 | 桌面导航严格表达“一级业务模块 → 二级功能入口”；点击一级模块进入当前账号可访问的首个二级入口，不生成中间占位页；新增、编辑、详情、审核、签发、整改等操作页不出现在侧栏，通过按钮、行操作、待办或业务关联进入。 |
| AC-06 | `design/cnas-page-map.md` 覆盖全部 136 个页面，并逐页记录页面编号、一级模块、二级菜单、页面类型、进入方式和返回目标；设计稿中的导航路径、页面标题、入口页/隐藏操作页分类与页面地图一致。 |
| AC-07 | 各分卷保留统一设计变量和可复用组件，关键业务页具有可辨识的业务语义、状态和操作，不以同一通用列表或详情布局替代全部业务场景。 |
| AC-08 | Pencil 深度校验未报告缺页、意外页、尺寸错误、导航不一致、按钮文字未居中、禁词、缺失业务语义节点或未解释的布局问题；10 张 PNG 与对应 `.pen` 内容一致且可人工辨读。 |
| AC-09 | 最终 Git 可见实现变更集已冻结；独立 `cognis_tester` 对 AC-01 至 AC-08 给出合格收据，独立 `cognis_reviewer` 以 findings-first 方式完成 Red Team 并批准同一指纹，父 Agent 在 fan-in 后重跑全部集成验证。 |
| AC-10 | 最终实现对生成器和页面规格脚本的修改仅服务于本轮页面体系重构，未修改前端、接口、数据库及其他授权范围外文件，项目治理校验通过。 |

## 验证计划

按以下顺序执行，Pencil IPC 相关命令不得并发：

1. `node scripts/generate-cnas-pencil-designs.mjs --check-generated`
2. `node scripts/generate-cnas-pencil-designs.mjs --validate-existing`
3. `node scripts/generate-cnas-pencil-designs.mjs --fingerprint`
4. 人工抽查 10 张 PNG 联系表及登录、工作台、委托、样品接收、原始记录、报告签发、设备、CAPA、内审、认可整改、权限管理和 6 个移动页，核对导航层级、按钮居中、禁词、长文本和关键状态。
5. `node .agents/cognis/governance/validate.mjs`

冻结前保存第 3 步输出的 64 位 SHA-256 聚合指纹。Tester 与 Reviewer 必须核验同一冻结指纹；任一后续 Git 可见实现改动都会使既有收据失效，必须生成新指纹并以新 turn 重新派发两类核验。Tester/Reviewer 回传后，父 Agent 检查实际 diff，并重新执行第 1、2、3、5 步作为 fan-in 后集成验证。

## 风险

- 136 页批量重构容易产生缺页、重复编号、分卷计数或页面地图漂移，必须同时用结构化校验和逐分卷人工抽查反证。
- `.pen` 是结构化源文件，绕过 Pencil 工具链可能破坏 schema 或组件引用；所有设计写入必须通过受支持工具完成。
- 单张联系表包含多个页面，自动布局为零不等于视觉可用；按钮、禁用态、长文本、浮层和关键业务页仍需人工检查。
- 清理演示标识后，虚构数据可能被误认为生产数据；数据内容必须保持非生产、不可识别且不包含未经核验的标准编号。
- 隐藏操作页若缺少进入方式或返回目标，会形成不可达或导航断链；页面地图与设计稿必须双向核对。
- Pencil CLI 使用单一 IPC，Tester 与其他 Pencil 操作并发会造成不稳定或相互干扰，相关命令必须串行。
- 本任务只交付设计资产，无法证明真实路由、权限、接口、数据库或业务状态机已实现；这些能力仍属于后续实现风险。
- 当前工作区存在其他协作者的未归属改动；冻结、审查和交付时必须按精确路径核对，不得覆盖或混入无关变更。

## 上下文缓存边界

- 稳定前缀：治理内核、Pencil 与测试专项规则、v3 schema、Pencil CLI 能力和设计规范版本。
- 动态后缀：本轮工作区状态、目标文件哈希、Pencil 命令输出、冻结指纹、Agent 收据、人工抽查结果和下一步动作。
- 工作区事实、规则、工具版本、冻结指纹或 fan-in 状态变化后刷新动态后缀并重新核对证据。
- 不把时间戳、随机运行 ID、实时日志、未排序集合或敏感数据写入稳定前缀或持久化缓存。

## 下一步动作

仅在声明的设计资产范围内完成十分卷重构与页面地图同步；全部实现验证通过后冻结 Git 可见变更集，并行派发只读 `cognis_tester` 与 `cognis_reviewer`，回填同文件 Handoff，最后由父 Agent fan-in 并重跑集成验证。

## 完整流程控制

```json
{
  "控制版本": 3,
  "任务类型": "单任务",
  "集成验证": [
    "node scripts/generate-cnas-pencil-designs.mjs --check-generated",
    "node scripts/generate-cnas-pencil-designs.mjs --validate-existing",
    "node scripts/generate-cnas-pencil-designs.mjs --fingerprint",
    "node .agents/cognis/governance/validate.mjs"
  ],
  "责任角色": "实现负责人",
  "写入范围": [
    "design/cnas-01-workbench.pen",
    "design/cnas-01-workbench.png",
    "design/cnas-02-customer-commission.pen",
    "design/cnas-02-customer-commission.png",
    "design/cnas-03-sample-management.pen",
    "design/cnas-03-sample-management.png",
    "design/cnas-04-testing-management.pen",
    "design/cnas-04-testing-management.png",
    "design/cnas-05-report-management.pen",
    "design/cnas-05-report-management.png",
    "design/cnas-06-resource-management.pen",
    "design/cnas-06-resource-management.png",
    "design/cnas-07-quality-management.pen",
    "design/cnas-07-quality-management.png",
    "design/cnas-08-governance-management.pen",
    "design/cnas-08-governance-management.png",
    "design/cnas-09-accreditation-management.pen",
    "design/cnas-09-accreditation-management.png",
    "design/cnas-10-system-management.pen",
    "design/cnas-10-system-management.png",
    "design/cnas-page-map.md",
    "design/cnas-validation-report.json",
    "scripts/cnas-page-specs-business.mjs",
    "scripts/cnas-page-specs-resources.mjs",
    "scripts/cnas-page-specs-governance.mjs",
    "scripts/generate-cnas-pencil-designs.mjs",
    "docs/tasks/CNAS-DESIGN-002.md",
    "docs/reviews/CNAS-DESIGN-002-red-team.md"
  ],
  "禁止动作": [
    "直接文本编辑 .pen 或绕过受支持 Pencil 工具链",
    "修改声明写入范围以外的 scripts/**、前端、接口、数据库、路由、部署或治理工具",
    "覆盖、删除或混入用户及其他协作者的未归属改动",
    "写入真实生产数据、个人信息、secret 或机器专属绝对路径",
    "在冻结核验期间修改 Git 可见实现变更集",
    "以旧指纹、历史日志或不同任务收据替代本轮证据"
  ],
  "输入": [
    "用户批准的十分卷、130 个桌面页与 6 个移动页重构计划",
    "docs/analysis/cnas-lims-requirements-framework.md",
    "docs/rules/pencil-rules.md",
    "design/cnas-page-map.md",
    "现有 CNAS Pencil 设计资产与只读验收脚本"
  ],
  "输出格式": [
    "10 份可编辑 Pencil .pen",
    "10 份同 basename PNG 预览",
    "覆盖 136 页的 design/cnas-page-map.md",
    "交付记录中的变更、验证、未验证项和剩余风险"
  ],
  "不得修改范围": [
    "写入范围之外的所有文件",
    "scripts/** 中除四个声明写入文件之外的内容",
    "任何前端、接口、数据库、路由、部署和治理实现"
  ],
  "依赖任务": [],
  "冲突任务": [],
  "并行安全": "独占写入",
  "时间盒分钟": 240,
  "停止条件": "AC-01 至 AC-10 全部获得当前冻结指纹下的有效证据，Tester 通过、Reviewer 批准且 fan-in 后集成验证全部成功",
  "回滚方案": "依据冻结前逐文件哈希恢复本任务精确写入范围内的原始资产；不得删除或覆盖用户及其他协作者的未归属改动",
  "人工确认": "不需要",
  "核验者": "cognis_tester",
  "红队审查者": "cognis_reviewer",
  "红队审查包": "docs/reviews/CNAS-DESIGN-002-red-team.md",
  "红队审查结论": "待审查",
  "独立核验模式": "原生子智能体",
  "合并回主线状态": "不需要"
}
```

## 交接记录

冻结前保持为空。冻结后由父 Agent 在本数组中分别为 Tester 与 Reviewer 创建独立编号，并完整追加 `待接收 → 已接收 → 已返回` 或 `待接收/已接收 → 阻塞` 历史；不得预填 Agent/运行收据、时间或变更集指纹。

```json
[]
```

## 验收证据

| AC-ID | 证据类型 | 命令或产物 | 退出码 | 核验时间 | 核验者 | 实际结果 |
| --- | --- | --- | --- | --- | --- | --- |

任务仍为开放状态，冻结前不预填历史证据或完成结论。

## 剩余风险

- 当前合同仅固定设计范围与验收门禁；在 Tester、Reviewer 和 fan-in 集成验证形成同一冻结指纹下的有效证据前，不得声明任务完成。
- 设计资产不能替代后续前端、路由、权限、接口、数据库与业务规则实现及其运行时验证。
