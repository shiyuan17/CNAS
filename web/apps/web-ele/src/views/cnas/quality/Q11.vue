<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '登记风险与机遇并持续监控应对状态。',
  fields: ["风险编号","来源","风险描述","责任部门","风险等级","应对状态"],
  id: 'Q11',
  mode: 'list',
  module: '质量管理',
  title: '风险与机遇台账',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

