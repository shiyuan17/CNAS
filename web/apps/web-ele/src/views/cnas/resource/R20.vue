<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R20', module: '供应商', title: '供应商准入', mode: 'approval',
  description: '审查供应商资料与能力，形成准入结论并维护合格名录。',
  fields: ['供应商', '服务类别', '资质证书', '能力范围', '准入结论', '有效状态'],
};
</script>

<template><CnasPage :page="page" /></template>
