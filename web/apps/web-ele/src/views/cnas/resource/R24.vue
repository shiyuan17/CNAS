<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R24', module: '采购管理', title: '采购验收与服务评价', mode: 'workflow',
  description: '核对采购订单，执行验收、登记偏差并反馈供应商绩效。',
  fields: ['订单编号', '验收对象', '验收项目', '验收结果', '偏差处置', '评价状态'],
};
</script>

<template><CnasPage :page="page" /></template>
