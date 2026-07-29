<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '管理能力验证实施、评价和归档。',
  fields: ["项目编号","组织方","实施阶段","结果指标","评价结论","处置状态"],
  id: 'Q05',
  mode: 'detail',
  module: '质量管理',
  title: '能力验证实施与评价',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

