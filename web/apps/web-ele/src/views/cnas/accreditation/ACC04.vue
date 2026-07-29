<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '开展认可条款自查并关联证据。',
  fields: ["条款编号","要求摘要","责任部门","责任人","符合性","证据数量","缺口状态"],
  id: 'ACC04',
  mode: 'matrix',
  module: '认可管理',
  title: '认可条款自查',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

