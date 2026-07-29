<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '监控登录活动并处置异常会话。',
  fields: ["用户账号","登录时间","来源地址","客户端","会话时长","风险标记","会话状态"],
  id: 'SYS06',
  mode: 'monitor',
  module: '系统管理',
  title: '登录与会话管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

