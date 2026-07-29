<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R05', module: '能力授权', title: '人员能力评价', mode: 'approval',
  description: '收集评价证据，实施能力评价并形成结论，作为授权和复评的依据。',
  fields: ['人员', '评价项目', '评价方式', '证据', '评价结论', '复评日期'],
};
</script>

<template><CnasPage :page="page" /></template>
