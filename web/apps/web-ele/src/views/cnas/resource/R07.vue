<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R07', module: '方法标准', title: '方法标准台账', mode: 'list',
  description: '登记方法标准、适用范围和版本，完成技术审核与受控发布。',
  fields: ['方法编号', '方法名称', '标准号', '版本', '适用范围', '受控状态'],
};
</script>

<template><CnasPage :page="page" /></template>
