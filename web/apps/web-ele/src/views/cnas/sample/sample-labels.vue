<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM06', module: '样品台账', title: '样品标签管理', mode: 'form', description: '预览受控标签内容，执行打印、补打或作废并留存记录。', fields: ["样品编号","标签模板","条码内容","打印数量","打印设备","打印原因","标签状态","操作记录"] };
</script>
<template><CnasPage :page="page" /></template>
