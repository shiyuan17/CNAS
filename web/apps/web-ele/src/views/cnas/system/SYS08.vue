<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '配置业务编号规则并进行预览校验。',
  fields: ["规则编码","业务对象","编号组成","序列周期","适用组织","预览结果","规则状态"],
  id: 'SYS08',
  mode: 'form',
  module: '系统管理',
  title: '编号规则',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

