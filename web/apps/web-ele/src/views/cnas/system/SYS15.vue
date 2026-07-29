<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '监控接口可用性、处理量和失败状态。',
  fields: ["接口编码","接口名称","数据方向","最近同步","处理数量","失败数量","接口状态"],
  id: 'SYS15',
  mode: 'monitor',
  module: '系统管理',
  title: '接口监控',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

