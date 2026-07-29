<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC04', module: '委托管理', title: '新建委托向导', mode: 'wizard', description: '分步登记客户要求、样品概况、检测项目和交付约定。', fields: ["客户信息","委托要求","样品概况","检测项目","方法要求","判定规则","交付要求","特殊约定"] };
</script>
<template><CnasPage :page="page" /></template>
