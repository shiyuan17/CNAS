<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'WB03', module: '我的待办', title: '我的待办', mode: 'list', description: '按类型、优先级和到期时间集中处理待办事项。', fields: ['待办编号', '待办类型', '业务来源', '业务摘要', '优先级', '发起人', '到期时间', '处理状态'] };
</script>
<template><CnasPage :page="page" /></template>
