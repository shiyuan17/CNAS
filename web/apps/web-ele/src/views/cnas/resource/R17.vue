<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R17', module: '物料管理', title: '库存预警与召回', mode: 'monitor',
  description: '识别库存和有效期风险，冻结批次并跟踪补货、召回与使用影响。',
  fields: ['预警类型', '物料', '批次', '当前库存', '有效期', '处置状态'],
};
</script>

<template><CnasPage :page="page" /></template>
