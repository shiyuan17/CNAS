<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '发布文件并跟踪分发签收。',
  fields: ["文件编号","发布版本","生效日期","分发范围","签收要求","培训要求","发布状态"],
  id: 'GOV04',
  mode: 'form',
  module: '体系管理',
  title: '文件发布与分发',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

