<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM01', module: '样品接收', title: '待接收样品', mode: 'list', description: '按预计到样时间和状态核对已受理委托的接收要求。', fields: ["委托编号","客户名称","预计样品","预计数量","到样方式","预计到样时间","接收要求","接收状态"] };
</script>
<template><CnasPage :page="page" /></template>
