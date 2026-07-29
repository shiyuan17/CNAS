<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'WB05', module: '消息中心', title: '消息中心', mode: 'list', description: '查看预警、公告和业务消息，并跟进关联事项。', fields: ['消息标题', '消息类型', '业务来源', '业务编号', '发送人', '发送时间', '阅读状态', '重要程度'] };
</script>
<template><CnasPage :page="page" /></template>
