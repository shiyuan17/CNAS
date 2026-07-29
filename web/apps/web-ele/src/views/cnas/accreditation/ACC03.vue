<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '配置并复评授权签字范围。',
  fields: ["签字人","所在部门","授权场所","授权范围","报告类型","有效期","授权状态"],
  id: 'ACC03',
  mode: 'matrix',
  module: '认可管理',
  title: '授权签字人管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

