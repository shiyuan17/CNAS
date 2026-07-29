<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R12', module: '设备管理', title: '设备校准与核查计划', mode: 'schedule',
  description: '制定、审批和执行校准及期间核查计划，并更新设备状态。',
  fields: ['计划类型', '设备', '计划日期', '执行机构', '责任人', '完成状态'],
};
</script>

<template><CnasPage :page="page" /></template>
