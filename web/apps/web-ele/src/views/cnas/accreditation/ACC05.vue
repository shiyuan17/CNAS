<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '生成申请材料清单并核验提交证据。',
  fields: ["材料编号","材料类别","关联条款","责任人","版本","核验结果","提交状态"],
  id: 'ACC05',
  mode: 'list',
  module: '认可管理',
  title: '申请材料与证据包',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

