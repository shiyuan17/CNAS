// 导航分组配置
// 驱动侧栏生成。一级菜单 -> 二级入口页（入口页显示在菜单，操作页隐藏）。
// 隐藏操作页通过按钮/待办/关联进入，不在菜单显示。

export const NavigationGroups = [
  {
    title: '工作台',
    icon: 'layout-dashboard',
    items: [
      ['WB02', '综合工作台', 'chart-no-axes-combined', true],
      ['WB03', '我的待办', 'clipboard-list', true],
    ],
  },
  {
    title: '客户与委托',
    icon: 'handshake',
    items: [
      ['CC01', '客户管理', 'users-round', true],
      ['CC03', '委托管理', 'files', true],
      ['CC09', '客户沟通', 'message-square', true],
      // CC02/CC04/CC05/CC06/CC07/CC08 为隐藏操作页
    ],
  },
  {
    title: '样品管理',
    icon: 'package-check',
    items: [
      ['SM01', '样品接收', 'inbox', true],
      ['SM04', '样品台账', 'archive', true],
      // SM02/SM03/SM05-SM12 为隐藏操作页
    ],
  },
  {
    title: '检测管理',
    icon: 'flask-conical',
    items: [
      ['TM01', '任务管理', 'list-checks', true],
      // TM02-TM14 为隐藏操作页
    ],
  },
  {
    title: '报告管理',
    icon: 'file-text',
    items: [
      ['RM01', '报告队列', 'file-stack', true],
      ['RM11', '报告归档', 'archive', true],
      // RM02-RM10 为隐藏操作页
    ],
  },
  {
    title: '审计',
    icon: 'history',
    items: [
      ['AUDIT', '审计轨迹', 'history', true],
    ],
  },
];

// 所有可见的导航页面 ID 集合
export const NavPageIds = new Set(
  NavigationGroups.flatMap((g) => g.items.map((item) => item[0])),
);

// 默认首页
export const DEFAULT_PAGE = 'WB02';
