<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '跟踪评审问题整改、验证和证据提交。',
  fields: ["问题编号","问题类型","关联条款","责任部门","整改期限","提交轮次","整改状态"],
  id: 'ACC07',
  mode: 'workflow',
  module: '认可管理',
  title: '评审问题与整改',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

