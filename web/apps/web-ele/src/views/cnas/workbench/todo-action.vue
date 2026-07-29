<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'WB04', module: '我的待办', title: '待办处理', mode: 'approval', description: '核对业务详情、核验清单和流程轨迹后完成处理。', fields: ['待办摘要', '业务编号', '业务详情', '核验清单', '流程轨迹', '历史意见', '处理动作', '处理意见'] };
</script>
<template><CnasPage :page="page" /></template>
