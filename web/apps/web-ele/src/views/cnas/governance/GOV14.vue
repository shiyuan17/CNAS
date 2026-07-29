<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '记录管理评审决定并跟踪措施。',
  fields: ["评审编号","评审输入","会议结论","决定事项","责任人","完成期限","措施状态"],
  id: 'GOV14',
  mode: 'approval',
  module: '体系管理',
  title: '管理评审执行与措施',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

