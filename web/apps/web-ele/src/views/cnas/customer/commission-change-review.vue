<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC08', module: '合同评审', title: '委托变更评审', mode: 'approval', description: '对比原版本和拟变更内容，重新评审受影响事项。', fields: ["原委托版本","变更来源","变更内容","影响样品","影响任务","影响报告","补充评审","客户确认","变更结论"] };
</script>
<template><CnasPage :page="page" /></template>
