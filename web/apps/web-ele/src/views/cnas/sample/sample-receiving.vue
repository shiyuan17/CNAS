<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM02', module: '样品接收', title: '样品接收工作台', mode: 'form', description: '清点到样、记录运输与外观状态，生成唯一样品编号。', fields: ["委托编号","样品名称","样品数量","包装状态","运输条件","接收时间","接收人","接收结论","样品编号"] };
</script>
<template><CnasPage :page="page" /></template>
