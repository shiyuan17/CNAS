<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM03', module: '样品接收', title: '样品异常确认', mode: 'approval', description: '记录异常证据、影响评价、客户意见和授权处置结论。', fields: ["异常编号","样品信息","异常类型","现场照片","条件偏差","影响说明","客户意见","技术意见","处置结论"] };
</script>
<template><CnasPage :page="page" /></template>
