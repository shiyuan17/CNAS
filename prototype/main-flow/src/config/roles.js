// 角色定义 + 权限矩阵原型
// 6 个演示角色，标注职责分离约束。

export const Roles = [
  { id: 'receiver', name: '业务受理人员', icon: 'user-plus', desc: '客户建档、委托登记、合同报价、客户确认', flows: ['P01'] },
  { id: 'tech-lead', name: '技术负责人', icon: 'user-cog', desc: '合同评审、任务排程、资源准入、变更影响评价', flows: ['P01', 'P03'] },
  { id: 'quality', name: '质量负责人', icon: 'shield-check', desc: '合同评审、记录锁定、报告归档、CAPA、样品处置', flows: ['P01', 'P02', 'P04'] },
  { id: 'sample-admin', name: '样品管理员', icon: 'package', desc: '样品接收、标签、分样、交接、留样、处置', flows: ['P02'] },
  { id: 'tester', name: '检测员', icon: 'flask-conical', desc: '任务开工、原始记录、数据计算、提交复核', flows: ['P03'] },
  { id: 'auth-signer', name: '授权签字人', icon: 'pen-tool', desc: '报告签发、认可标识核验、更正/撤回批准', flows: ['P04'] },
];

// 默认角色
export const DEFAULT_ROLE = '业务受理人员';

// 根据角色名获取角色定义
export function getRole(name) {
  return Roles.find((r) => r.name === name) || null;
}
