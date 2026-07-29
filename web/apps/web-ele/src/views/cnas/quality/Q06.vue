<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '集中登记、分级和跟踪质量事件。',
  fields: ["事件编号","事件来源","事件类型","严重度","责任部门","事件状态"],
  id: 'Q06',
  mode: 'list',
  module: '质量管理',
  title: '质量事件中心',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

