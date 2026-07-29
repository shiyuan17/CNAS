<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM01', module: '任务管理', title: '检测任务列表', mode: 'list',
  description: '按专业组、项目、执行人、日期和状态跟踪检测任务的时限、资源冲突与异常标识。',
  fields: ['任务编号', '委托编号', '样品编号', '检测项目', '计划时间', '执行人', '任务进度', '异常标识', '任务状态'],
};
</script>

<template><CnasPage :page="page" /></template>
