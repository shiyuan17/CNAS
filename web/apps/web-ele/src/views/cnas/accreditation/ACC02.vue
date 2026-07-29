<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护认可范围版本和能力项。',
  fields: ["范围编号","场所","检测对象","项目参数","方法标准","限制说明","有效状态"],
  id: 'ACC02',
  mode: 'matrix',
  module: '认可管理',
  title: '认可范围管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

