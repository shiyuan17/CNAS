<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R26', module: '分包管理', title: '分包执行与结果验收', mode: 'detail',
  description: '下达分包任务、交接样品、跟踪执行，验收结果并纳入报告。',
  fields: ['分包任务', '分包方', '样品', '交付日期', '结果验收', '引用状态'],
};
</script>

<template><CnasPage :page="page" /></template>
