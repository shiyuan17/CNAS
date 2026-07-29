<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM09', module: '报告更正', title: '报告更正', mode: 'workflow',
  description: '基于原报告创建不可覆盖的新版本，重走审核、签发、发布并通知客户。',
  fields: ['原报告', '更正类型', '更正原因', '更正内容', '影响范围', '新版本', '审核意见', '签发意见', '客户通知', '更正状态'],
};
</script>

<template><CnasPage :page="page" /></template>
