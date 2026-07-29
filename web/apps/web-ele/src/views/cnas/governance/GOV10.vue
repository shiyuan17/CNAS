<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '制定内部审核计划并核验独立性。',
  fields: ["计划编号","审核范围","审核依据","计划日期","审核组长","审核成员","计划状态"],
  id: 'GOV10',
  mode: 'schedule',
  module: '体系管理',
  title: '内部审核计划',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

