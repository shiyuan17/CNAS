<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM05', module: '样品台账', title: '样品详情与追踪', mode: 'detail', description: '沿样品时间线核对接收、交接、位置、领用与处置记录。', fields: ["样品基本信息","父子样关系","接收记录","位置轨迹","交接记录","环境记录","领用记录","关联任务","处置记录"] };
</script>
<template><CnasPage :page="page" /></template>
