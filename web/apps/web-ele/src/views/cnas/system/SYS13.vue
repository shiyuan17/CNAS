<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '设计工作流节点、条件和时限。',
  fields: ["流程编码","流程版本","节点名称","办理角色","分支条件","超时规则","校验结果"],
  id: 'SYS13',
  mode: 'workflow',
  module: '系统管理',
  title: '工作流设计',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

