<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '管理评审关联的质量事件和持续改进。',
  fields: ["事件编号","事件来源","严重度","责任部门","原因分析","措施期限","有效性状态"],
  id: 'GOV15',
  mode: 'workflow',
  module: '体系管理',
  title: '质量事件与持续改进',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

