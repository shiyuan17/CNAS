<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'WB02', module: '综合工作台', title: '综合工作台', mode: 'dashboard', description: '集中查看业务、质量和资源指标，及时处理逾期任务与风险预警。', fields: ['待办数量', '委托进度', '样品状态', '检测任务', '报告时效', '质量风险', '资源预警'] };
</script>
<template><CnasPage :page="page" /></template>
