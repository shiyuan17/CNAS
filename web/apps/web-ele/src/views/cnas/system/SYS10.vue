<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '配置业务消息触发、渠道和接收对象。',
  fields: ["消息编码","业务事件","消息渠道","接收对象","触发条件","发送时机","启用状态"],
  id: 'SYS10',
  mode: 'form',
  module: '系统管理',
  title: '消息配置',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

