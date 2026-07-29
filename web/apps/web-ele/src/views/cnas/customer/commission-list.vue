<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC03', module: '委托管理', title: '委托列表', mode: 'list', description: '按客户、状态和时间范围查看委托时限、评审进度与异常。', fields: ["委托编号","客户名称","委托类型","样品数量","期望日期","评审进度","责任人","委托状态"] };
</script>
<template><CnasPage :page="page" /></template>
