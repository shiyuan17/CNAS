<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM08', module: '报告编制', title: '报告详情与版本', mode: 'detail',
  description: '浏览报告引用快照、审核签发、发布送达证据与原报告、更正版本差异。',
  fields: ['报告基本信息', '报告版本', '关联委托', '结果快照', '审核记录', '签发记录', '发布记录', '下载记录', '更正关系', '报告状态'],
};
</script>

<template><CnasPage :page="page" /></template>
