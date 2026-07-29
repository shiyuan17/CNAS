<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'WB06', module: '全局搜索', title: '全局搜索', mode: 'list', description: '按名称、编号或关键内容定位授权范围内的业务记录。', fields: ['搜索关键词', '业务分类', '业务编号', '摘要', '责任人', '更新时间', '访问状态'] };
</script>
<template><CnasPage :page="page" /></template>
