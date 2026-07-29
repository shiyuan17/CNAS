<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM08', module: '样品流转', title: '样品交接', mode: 'approval', description: '核对移交与接收责任，确认后连续更新样品位置和状态。', fields: ["交接单号","样品编号","移交人","接收人","移交位置","目标位置","交接时间","样品状态","接收结论"] };
</script>
<template><CnasPage :page="page" /></template>
