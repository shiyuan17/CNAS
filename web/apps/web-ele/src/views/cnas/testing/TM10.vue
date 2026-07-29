<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM10', module: '结果审核', title: '复检与重测申请', mode: 'approval',
  description: '说明技术理由、资源条件与结果采用规则，经审批后生成关联任务。',
  fields: ['申请编号', '原任务', '原始结果', '申请类型', '申请原因', '样品余量', '执行方案', '批准意见', '新任务', '结果采用规则'],
};
</script>

<template><CnasPage :page="page" /></template>
