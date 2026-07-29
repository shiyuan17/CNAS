<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护认可证书及其受控变更。',
  fields: ["证书编号","机构名称","证书版本","有效期","变更类型","影响范围","证书状态"],
  id: 'ACC08',
  mode: 'form',
  module: '认可管理',
  title: '认可证书与变更',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

