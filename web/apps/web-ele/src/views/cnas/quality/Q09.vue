<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '制定、审批和执行纠正措施。',
  fields: ["CAPA编号","来源事件","根本原因","措施","责任人","截止日期"],
  id: 'Q09',
  mode: 'workflow',
  module: '质量管理',
  title: 'CAPA 计划与执行',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

