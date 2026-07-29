<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM01', module: '报告编制', title: '报告任务列表', mode: 'list',
  description: '按状态、客户、编制人和期限跟踪报告任务及逾期、退回和更正标识。',
  fields: ['报告编号', '委托编号', '客户名称', '报告类型', '编制人', '审核人', '授权签字人', '交付期限', '报告版本', '报告状态'],
};
</script>

<template><CnasPage :page="page" /></template>
