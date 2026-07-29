<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '登记和查新外来受控文件。',
  fields: ["外来文件编号","名称","来源","版本","发布日期","查新日期","有效状态"],
  id: 'GOV05',
  mode: 'list',
  module: '体系管理',
  title: '外来文件管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

