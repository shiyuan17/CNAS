// 渲染器注册表
// 按 pageId 分发到对应渲染函数。各模块渲染器在各批次逐步注册。

// 渲染器注册表：pageId -> render function
const renderers = {};

// 注册渲染器
export function registerRenderer(pageId, fn) {
  renderers[pageId] = fn;
}

// 批量注册
export function registerRenderers(map) {
  Object.entries(map).forEach(([pageId, fn]) => {
    renderers[pageId] = fn;
  });
}

// 获取渲染器
export function getRenderer(pageId) {
  return renderers[pageId] || null;
}

// 渲染页面
export function renderPage(pageId, ctx) {
  const fn = renderers[pageId];
  if (fn) return fn(ctx);
  return `<div class="empty-state"><p>页面 ${pageId} 尚未实现</p></div>`;
}
