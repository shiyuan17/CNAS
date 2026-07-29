<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R13', module: '设备管理', title: '设备使用维护记录', mode: 'detail',
  description: '记录设备使用前检查、任务使用、维护维修和状态确认。',
  fields: ['设备', '记录类型', '使用任务', '发生时间', '执行人', '结果状态'],
};
</script>

<template><CnasPage :page="page" /></template>
