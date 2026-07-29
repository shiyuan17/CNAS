<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R15', module: '物料管理', title: '物料与批次库存', mode: 'list',
  description: '维护物料主数据和批次库存，记录入库、领用、消耗和盘点调整。',
  fields: ['物料编码', '物料名称', '批次', '库存量', '有效期', '库存状态'],
};
</script>

<template><CnasPage :page="page" /></template>
