<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护用户账号、岗位和有效期。',
  fields: ["用户账号","姓名","所属组织","岗位","联系方式","有效期","账号状态"],
  id: 'SYS02',
  mode: 'list',
  module: '系统管理',
  title: '用户管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

