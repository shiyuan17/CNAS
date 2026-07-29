<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '完成记录接收、检查和受控归档。',
  fields: ["档案编号","记录类型","业务编号","责任部门","形成日期","归档日期","完整性状态"],
  id: 'GOV08',
  mode: 'workflow',
  module: '体系管理',
  title: '记录归档',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

