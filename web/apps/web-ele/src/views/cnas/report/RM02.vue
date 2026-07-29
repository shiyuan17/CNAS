<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM02', module: '报告编制', title: '报告编制', mode: 'form',
  description: '引用受控委托、样品和结果信息，按模板完成报告编排、预览与审核提交。',
  fields: ['报告模板', '客户信息', '委托信息', '样品描述', '检测方法', '检测结果', '判定结论', '声明信息', '附件', '报告版本'],
};
</script>

<template><CnasPage :page="page" /></template>
