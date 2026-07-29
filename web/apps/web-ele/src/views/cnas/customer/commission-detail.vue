<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC05', module: '委托管理', title: '委托详情', mode: 'detail', description: '查看受控委托版本及样品、任务和报告的完整进度。', fields: ["委托基本信息","客户要求","项目清单","评审结论","样品进度","任务进度","报告进度","流程记录"] };
</script>
<template><CnasPage :page="page" /></template>
