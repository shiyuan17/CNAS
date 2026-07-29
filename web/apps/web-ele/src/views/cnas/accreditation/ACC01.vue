<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护认可项目、材料和评审过程。',
  fields: ["项目编号","评审类型","认可机构","申请日期","计划日期","项目负责人","项目状态"],
  id: 'ACC01',
  mode: 'list',
  module: '认可管理',
  title: '认可项目台账',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

