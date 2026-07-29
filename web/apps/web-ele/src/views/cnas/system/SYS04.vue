<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '配置权限并检查职责分离冲突。',
  fields: ["权限编码","权限名称","权限类型","授权对象","数据范围","生效时间","授权状态"],
  id: 'SYS04',
  mode: 'matrix',
  module: '系统管理',
  title: '权限管理',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

