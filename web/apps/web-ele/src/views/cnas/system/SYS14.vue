<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '编辑模板版式并校验预览结果。',
  fields: ["模板编号","模板版本","版式区域","数据项","条件区块","预览样本","校验结果"],
  id: 'SYS14',
  mode: 'form',
  module: '系统管理',
  title: '模板编辑与预览',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

