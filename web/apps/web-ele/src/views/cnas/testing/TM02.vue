<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM02', module: '任务排程', title: '任务排程', mode: 'schedule',
  description: '核对授权、设备、环境与前置条件后分配计划时间和执行资源。',
  fields: ['待排任务', '检测项目', '计划日期', '执行人员', '使用设备', '场所环境', '前置任务', '资源冲突', '排程状态'],
};
</script>

<template><CnasPage :page="page" /></template>
