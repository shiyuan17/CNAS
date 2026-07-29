<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '评价风险等级并跟踪应对措施。',
  fields: ["风险编号","可能性","影响程度","风险等级","应对措施","剩余风险"],
  id: 'Q12',
  mode: 'matrix',
  module: '质量管理',
  title: '风险评价与措施跟踪',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

