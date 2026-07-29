<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护角色职责、成员和互斥规则。',
  fields: ["角色编码","角色名称","角色类型","适用组织","成员数量","互斥角色","角色状态"],
  id: 'SYS03',
  mode: 'form',
  module: '系统管理',
  title: '角色管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

