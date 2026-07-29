<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '分配迎审任务并汇总准备状态。',
  fields: ["评审编号","评审日期","评审组","评审场所","任务名称","责任人","准备状态"],
  id: 'ACC06',
  mode: 'schedule',
  module: '认可管理',
  title: '评审计划与迎审任务',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

