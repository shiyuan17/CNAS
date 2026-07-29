<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '发起文件作废并跟踪副本回收。',
  fields: ["处置编号","文件编号","作废版本","作废原因","替代文件","回收范围","处置状态"],
  id: 'GOV06',
  mode: 'form',
  module: '体系管理',
  title: '文件作废与回收',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

