<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '跟踪审核发现整改和独立验证。',
  fields: ["发现编号","发现类型","条款","责任部门","原因分析","整改期限","验证状态"],
  id: 'GOV12',
  mode: 'workflow',
  module: '体系管理',
  title: '审核发现与整改',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

