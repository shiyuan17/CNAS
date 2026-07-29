<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM12', module: '结果审核', title: '结果复核工作台', mode: 'approval',
  description: '逐项比对原始记录、计算过程与最终结果，提交通过或退回意见。',
  fields: ['任务编号', '样品编号', '检测项目', '原始记录', '计算过程', '检测结果', '异常记录', '历史版本', '复核意见', '复核状态'],
};
</script>

<template><CnasPage :page="page" /></template>
