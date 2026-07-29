<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '受控检索审计日志和关联业务记录。',
  fields: ["发生时间","操作主体","来源地址","业务对象","操作动作","变更前后值","操作结果"],
  id: 'SYS05',
  mode: 'monitor',
  module: '系统管理',
  title: '审计日志',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

