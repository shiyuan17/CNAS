<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R14', module: '设备管理', title: '设备异常与影响评价', mode: 'workflow',
  description: '隔离不正常设备，识别受影响工作，经技术评价和处置后恢复使用。',
  fields: ['设备', '异常类型', '影响时段', '关联任务', '处置措施', '评价结论'],
};
</script>

<template><CnasPage :page="page" /></template>
