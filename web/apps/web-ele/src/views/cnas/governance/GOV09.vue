<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '控制档案借阅、归还和销毁审批。',
  fields: ["申请编号","档案编号","申请人","用途","借阅期限","归还状态","销毁状态"],
  id: 'GOV09',
  mode: 'approval',
  module: '体系管理',
  title: '档案借阅与销毁',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

