<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM10', module: '样品流转', title: '样品领用与归还', mode: 'workflow', description: '核对检测任务与样品，记录领用、使用、剩余和归还数量。', fields: ["领用单号","任务编号","样品编号","领用数量","领用人","领用时间","使用数量","归还数量","归还状态"] };
</script>
<template><CnasPage :page="page" /></template>
