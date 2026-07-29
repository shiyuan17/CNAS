<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '查询受控文件及其适用版本。',
  fields: ["文件编号","文件名称","文件类型","版本","生效日期","适用范围","受控状态"],
  id: 'GOV01',
  mode: 'list',
  module: '体系管理',
  title: '受控文件库',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

