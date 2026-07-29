<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R19', module: '环境设施', title: '环境异常与影响评价', mode: 'workflow',
  description: '确认环境报警、控制现场、识别关联任务并评价恢复条件。',
  fields: ['报警点位', '异常时段', '最大偏差', '关联任务', '恢复状态', '评价结论'],
};
</script>

<template><CnasPage :page="page" /></template>
