<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R22', module: '采购管理', title: '采购申请与审批', mode: 'form',
  description: '提出采购需求，完成技术确认、预算审批、供应商选择和订单形成。',
  fields: ['申请编号', '采购对象', '技术要求', '需求日期', '预算', '审批状态'],
};
</script>

<template><CnasPage :page="page" /></template>
