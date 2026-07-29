<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC07', module: '合同评审', title: '合同评审', mode: 'approval', description: '评估客户要求、方法能力、资源条件和交付风险。', fields: ["能力范围","方法适用性","人员授权","设备资源","环境条件","交付周期","分包安排","判定规则","评审结论"] };
</script>
<template><CnasPage :page="page" /></template>
