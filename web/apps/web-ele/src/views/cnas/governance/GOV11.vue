<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '记录内部审核证据、发现和报告。',
  fields: ["审核编号","检查条款","受审核部门","客观证据","符合性判定","审核员","执行进度"],
  id: 'GOV11',
  mode: 'workflow',
  module: '体系管理',
  title: '内部审核执行',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

