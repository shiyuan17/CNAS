<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM13', module: '结果审核', title: '质量控制关联', mode: 'workflow',
  description: '关联质控样、空白和平行样结果，识别失控趋势并放行批次结果。',
  fields: ['检测批次', '质控类型', '质控样编号', '目标值', '实测值', '控制限', '规则判定', '趋势图', '处置措施', '放行状态'],
};
</script>

<template><CnasPage :page="page" /></template>
