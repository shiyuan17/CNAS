<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM04', module: '样品台账', title: '样品台账', mode: 'list', description: '查看样品及子样当前位置、状态、异常和待处置标识。', fields: ["样品编号","样品名称","客户","委托编号","样品类型","当前位置","保管条件","关联任务","样品状态"] };
</script>
<template><CnasPage :page="page" /></template>
