<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R16', module: '物料管理', title: '入库验证与领用', mode: 'workflow',
  description: '核对到货、完成质量验证和入库，并扫码领用关联检测任务。',
  fields: ['物料', '批次', '验收项目', '数量', '库位', '经办人'],
};
</script>

<template><CnasPage :page="page" /></template>
