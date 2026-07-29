<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护业务模板及其受控版本。',
  fields: ["模板编号","模板名称","模板类型","适用业务","版本","生效日期","模板状态"],
  id: 'SYS09',
  mode: 'form',
  module: '系统管理',
  title: '模板管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

