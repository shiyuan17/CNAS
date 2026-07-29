<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC01', module: '客户管理', title: '客户台账', mode: 'list', description: '维护客户档案、联系人、信用状态和最近委托摘要。', fields: ["客户编号","客户名称","客户类型","联系人","联系方式","信用状态","保密等级","合作状态"] };
</script>
<template><CnasPage :page="page" /></template>
