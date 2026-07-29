<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '控制不符合工作并评价结果影响。',
  fields: ["事件编号","不符合描述","严重度","影响对象","控制措施","处置决定"],
  id: 'Q08',
  mode: 'workflow',
  module: '质量管理',
  title: '不符合工作控制',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

