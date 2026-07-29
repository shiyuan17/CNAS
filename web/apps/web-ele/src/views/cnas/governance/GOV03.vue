<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '审核并批准文件版本。',
  fields: ["审批编号","文件名称","拟生效版本","编制人","审核意见","批准意见","审批状态"],
  id: 'GOV03',
  mode: 'approval',
  module: '体系管理',
  title: '文件审核与批准',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

