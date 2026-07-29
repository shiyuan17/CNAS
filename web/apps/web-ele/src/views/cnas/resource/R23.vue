<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R23', module: '采购管理', title: '采购订单与到货跟踪', mode: 'list',
  description: '下达订单、跟踪交付、登记到货和偏差，并移交验收。',
  fields: ['订单编号', '供应商', '采购对象', '承诺日期', '到货进度', '订单状态'],
};
</script>

<template><CnasPage :page="page" /></template>
