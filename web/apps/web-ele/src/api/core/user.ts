import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';
import { getDemoUser, isDemoMode } from '#/cnas/demo';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  if (isDemoMode()) {
    return getDemoUser();
  }
  return requestClient.get<UserInfo>('/user/info');
}
