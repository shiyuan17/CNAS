<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '查看脱敏失败详情并跟踪重试处理。',
  fields: ["交换批次","接口名称","业务对象","失败时间","错误类型","错误信息","重试状态"],
  id: 'SYS16',
  mode: 'detail',
  module: '系统管理',
  title: '接口失败详情',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

