<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM11', module: '结果审核', title: '检测结果汇总', mode: 'list',
  description: '核对任务全部结果、单位、检出限、不确定度和异常标识后批量提交复核。',
  fields: ['样品编号', '检测项目', '检测结果', '单位', '检出限', '不确定度', '判定结果', '异常标识', '记录版本', '提交状态'],
};
</script>

<template><CnasPage :page="page" /></template>
