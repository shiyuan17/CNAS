<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '独立验证 CAPA 措施有效性并批准关闭。',
  fields: ["CAPA编号","验证方案","验证证据","验证人员","验证结论","关闭状态"],
  id: 'Q10',
  mode: 'approval',
  module: '质量管理',
  title: 'CAPA 有效性验证',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

