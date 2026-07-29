<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM03', module: '任务管理', title: '检测任务详情', mode: 'detail',
  description: '查看任务锁定的委托要求、方法、人员、设备与环境资源快照及执行轨迹。',
  fields: ['任务基本信息', '样品信息', '检测要求', '方法版本', '人员授权', '设备资源', '环境条件', '原始记录', '流程轨迹'],
};
</script>

<template><CnasPage :page="page" /></template>
