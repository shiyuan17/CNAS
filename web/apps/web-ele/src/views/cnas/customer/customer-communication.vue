<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC09', module: '客户管理', title: '客户沟通与满意度', mode: 'workflow', description: '记录客户沟通、反馈和跟进事项，并转入受控质量流程。', fields: ["客户","沟通类型","关联委托","沟通渠道","沟通内容","附件","责任人","反馈结果","跟进状态"] };
</script>
<template><CnasPage :page="page" /></template>
