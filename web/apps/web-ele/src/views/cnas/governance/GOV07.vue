<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '维护记录模板、责任和保存规则。',
  fields: ["模板编号","记录名称","责任部门","载体形式","保存期限","归档规则","有效版本"],
  id: 'GOV07',
  mode: 'list',
  module: '体系管理',
  title: '记录模板与清单',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

