<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '支持投诉与申诉的独立调查和正式回复。',
  fields: ["投诉编号","客户","受理日期","调查人员","处理结论","回复状态"],
  id: 'Q07',
  mode: 'approval',
  module: '质量管理',
  title: '投诉与申诉处理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

