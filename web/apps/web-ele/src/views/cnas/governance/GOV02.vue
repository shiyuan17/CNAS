<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '编制和修订受控文件。',
  fields: ["申请编号","文件编号","修订类型","修订原因","修订内容","编制人","目标版本"],
  id: 'GOV02',
  mode: 'form',
  module: '体系管理',
  title: '文件编制与修订',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

