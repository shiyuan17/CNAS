<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R06', module: '能力授权', title: '能力授权矩阵', mode: 'matrix',
  description: '依据评价结论定义人员的项目、方法、设备和场所授权范围。',
  fields: ['人员', '检测项目', '方法版本', '设备', '授权场所', '授权状态'],
};
</script>

<template><CnasPage :page="page" /></template>
