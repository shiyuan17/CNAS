// 路由导航工具
// 独立模块，避免 app.js 与页面模块之间的循环依赖。

export function go(viewId) {
  if (location.hash === `#/${viewId}`) {
    // 同页刷新：手动触发 hashchange 不生效，直接 dispatch 自定义事件
    document.dispatchEvent(new CustomEvent('cnas:navigate', { detail: { viewId } }));
  } else {
    location.hash = `#/${viewId}`;
  }
}

// 设置当前业务上下文（用于页面间传递选中的对象 ID）
export function setCurrentContext(patch) {
  document.dispatchEvent(new CustomEvent('cnas:set-context', { detail: patch }));
}
