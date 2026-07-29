<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '汇总质控结果并支持趋势复核。',
  fields: ["检测项目","质控批次","结果","统计参数","规则判定","结果状态"],
  id: 'Q02',
  mode: 'dashboard',
  module: '质量管理',
  title: '质控结果与趋势',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

