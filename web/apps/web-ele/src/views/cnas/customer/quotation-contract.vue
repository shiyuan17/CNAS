<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC06', module: '合同评审', title: '报价与合同', mode: 'form', description: '生成报价、维护合同条款并登记客户确认结果。', fields: ["报价编号","计费项目","数量","单价","税率","合同条款","付款条件","有效期","客户确认"] };
</script>
<template><CnasPage :page="page" /></template>
