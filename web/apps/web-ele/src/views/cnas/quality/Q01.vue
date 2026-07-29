<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '确保检测结果有效性的质量控制计划。',
  fields: ["计划编号","检测项目","质控方式","实施频次","责任人","计划状态"],
  id: 'Q01',
  mode: 'schedule',
  module: '质量管理',
  title: '质量控制计划',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

