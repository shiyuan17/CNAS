<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R03', module: '培训管理', title: '培训计划', mode: 'schedule',
  description: '识别培训需求，制定、审批和发布计划并通知适用岗位的参训人员。',
  fields: ['计划编号', '培训主题', '适用岗位', '计划日期', '负责人', '计划状态'],
};
</script>

<template><CnasPage :page="page" /></template>
