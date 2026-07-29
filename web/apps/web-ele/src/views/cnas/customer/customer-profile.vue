<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'CC02', module: '客户管理', title: '客户档案', mode: 'detail', description: '维护客户主体、联系人、结算资料及受控资质附件。', fields: ["主体信息","联系人信息","开票信息","收件信息","保密协议","资质附件","委托历史","变更记录"] };
</script>
<template><CnasPage :page="page" /></template>
