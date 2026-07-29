<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM09', module: '样品流转', title: '样品存储与位置', mode: 'monitor', description: '匹配样品保管条件与可用位置，追踪存储环境和位置变化。', fields: ["存储区域","位置编码","样品编号","保管条件","环境状态","容量占用","入库时间","到期时间","位置状态"] };
</script>
<template><CnasPage :page="page" /></template>
