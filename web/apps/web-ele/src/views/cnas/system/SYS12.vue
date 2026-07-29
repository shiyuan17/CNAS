<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '分配用户角色和数据范围。',
  fields: ["用户账号","所属组织","待授角色","数据范围","授权原因","有效期","审批状态"],
  id: 'SYS12',
  mode: 'matrix',
  module: '系统管理',
  title: '用户角色授权',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

