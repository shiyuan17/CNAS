<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '配置管理评审输入和议程。',
  fields: ["评审编号","评审周期","会议日期","输入主题","材料责任人","材料截止日","准备状态"],
  id: 'GOV13',
  mode: 'schedule',
  module: '体系管理',
  title: '管理评审计划',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

