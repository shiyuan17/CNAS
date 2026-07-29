<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'SM11', module: '留样管理', title: '留样管理', mode: 'schedule', description: '登记留样依据、期限和存储位置，跟进临期与环境异常。', fields: ["样品编号","留样依据","留样数量","留样位置","开始日期","到期日期","延期原因","审批状态","留样状态"] };
</script>
<template><CnasPage :page="page" /></template>
