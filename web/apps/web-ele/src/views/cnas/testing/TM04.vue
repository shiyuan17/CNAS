<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM04', module: '任务管理', title: '任务领用与开工', mode: 'workflow',
  description: '在开工前确认人员授权、样品、方法、设备、物料和环境条件。',
  fields: ['任务编号', '执行人员', '样品清单', '方法版本', '设备状态', '环境状态', '物料状态', '开工检查', '开工时间'],
};
</script>

<template><CnasPage :page="page" /></template>
