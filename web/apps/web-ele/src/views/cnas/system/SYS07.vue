<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '配置工作流版本、节点和发布状态。',
  fields: ["流程编码","流程名称","适用业务","版本","节点数量","生效日期","流程状态"],
  id: 'SYS07',
  mode: 'workflow',
  module: '系统管理',
  title: '工作流配置',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

