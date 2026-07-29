<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM04', module: '报告审核', title: '报告审核', mode: 'approval',
  description: '核对报告与委托、样品、方法和已复核结果，留存审核意见与版本记录。',
  fields: ['报告摘要', '委托要求', '样品信息', '方法信息', '结果对照', '判定结论', '完整性检查', '历史意见', '审核意见', '审核状态'],
};
</script>

<template><CnasPage :page="page" /></template>
