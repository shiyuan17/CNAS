# CNAS LIMS 核心主流程仿真原型

> **候选仿真原型 · 非合规依据 · 虚构数据**

覆盖 P01-P04 完整主链（客户委托 -> 样品生命周期 -> 检测执行 -> 报告发布）的 HTML 仿真交互原型。

## 运行方式

直接在浏览器中打开 `index.html`，或起一个本地静态服务：

```bash
# 方式一：直接双击 index.html

# 方式二：本地静态服务（推荐，避免某些浏览器的 file:// 限制）
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 技术栈

- 纯原生 JavaScript（ES Module，无构建工具）
- 浏览器原生 `import` 支持
- localStorage 持久化
- lucide 图标库（CDN）

## 架构

```
src/
├── app.js              # 入口：路由、事件委托、渲染
├── state/              # 状态层：store + seed
├── data/               # 数据层：schema + repository(CRUD)
├── flow/               # 流程层：state-machine + flow-catalog
├── config/             # 配置层：pages + navigation + roles
├── ui/                 # UI 层：shell + components + overlay + renderers
└── pages/              # 页面层：各模块渲染函数
```

## 扩展方式

- **新增页面**：`config/pages.js` 加规格 + `pages/` 加渲染函数 + 注册到 renderers
- **新增状态流转**：`flow/state-machine.js` 转换表加一条规则
- **新增业务对象**：`data/schema.js` 加类型 + `seed.js` 加种子数据
- **迁移到真实后端**：替换 `repository.js` 的 localStorage 实现为 API 调用

## 合规边界

- 所有数据为虚构演示数据
- `[待确认]` 项按"默认阻断"策略实现并标注
- 不连接真实账户、签名、仪器或外部接口
