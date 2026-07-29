import type { RouteRecordStringComponent, UserInfo } from '@vben/types';

const demoEnabled = import.meta.env.VITE_USE_DEMO !== 'false';

const demoUser: UserInfo = {
  avatar: '',
  desc: 'CNAS LIMS 本地演示管理员',
  homePath: '/cnas/workbench/dashboard',
  realName: '演示管理员',
  roles: ['cnas-admin'],
  token: 'cnas-demo-token',
  userId: 'cnas-demo-admin',
  username: 'demo-admin',
};

function isDemoMode() {
  return demoEnabled;
}

function getDemoToken() {
  return 'cnas-demo-token';
}

function getDemoUser() {
  return demoUser;
}

function getDemoAccessCodes() {
  return ['cnas:all'];
}

function getDemoMenus(): RouteRecordStringComponent[] {
  return [];
}

export {
  getDemoAccessCodes,
  getDemoMenus,
  getDemoToken,
  getDemoUser,
  isDemoMode,
};
