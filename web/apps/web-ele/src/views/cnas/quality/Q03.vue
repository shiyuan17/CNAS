<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '记录失控调查、影响评价和恢复验证。',
  fields: ["调查编号","失控规则","影响批次","原因分析","处置措施","恢复结论"],
  id: 'Q03',
  mode: 'workflow',
  module: '质量管理',
  title: '质控失控调查',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

