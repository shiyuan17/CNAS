<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护数据字典及业务引用状态。',
  fields: ["字典编码","字典名称","字典项编码","显示名称","适用范围","生效日期","字典状态"],
  id: 'SYS11',
  mode: 'list',
  module: '系统管理',
  title: '数据字典',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

