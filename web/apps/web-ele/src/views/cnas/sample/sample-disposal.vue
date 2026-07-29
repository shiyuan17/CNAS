<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM12', module: '样品处置', title: '样品处置', mode: 'approval', description: '依据合同和法规完成样品归还、销毁或转存并归档证据。', fields: ["处置单号","样品编号","处置依据","处置方式","计划日期","客户确认","审批人","执行人","处置结果"] };
</script>
<template><CnasPage :page="page" /></template>
