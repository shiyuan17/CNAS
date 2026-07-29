<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护组织层级及其生效信息。',
  fields: ["组织编码","组织名称","组织类型","上级组织","负责人","生效日期","组织状态"],
  id: 'SYS01',
  mode: 'form',
  module: '系统管理',
  title: '组织管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

