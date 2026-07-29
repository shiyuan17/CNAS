<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R21', module: '供应商', title: '供应商绩效评价', mode: 'list',
  description: '汇总履约、质量与服务评分，完成再评价并决定维持或退出。',
  fields: ['供应商', '评价周期', '交付评分', '质量评分', '服务评分', '评价结论'],
};
</script>

<template><CnasPage :page="page" /></template>
