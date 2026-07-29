<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM07', module: '样品流转', title: '分样与子样管理', mode: 'workflow', description: '按分样方案生成子样并校验数量平衡与父子样关系。', fields: ["父样编号","分样方案","子样编号","用途","数量","单位","容器","保管条件","执行人"] };
</script>
<template><CnasPage :page="page" /></template>
