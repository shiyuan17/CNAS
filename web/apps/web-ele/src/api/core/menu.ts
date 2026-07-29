import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';
import { getDemoMenus, isDemoMode } from '#/cnas/demo';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  if (isDemoMode()) {
    return getDemoMenus();
  }
  return requestClient.get<RouteRecordStringComponent[]>('/menu/all');
}
