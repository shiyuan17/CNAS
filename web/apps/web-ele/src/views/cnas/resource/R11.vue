<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R11', module: '设备管理', title: '设备台账', mode: 'list',
  description: '登记、验收和维护设备台账，更新使用、停用和报废状态。',
  fields: ['设备编号', '设备名称', '型号规格', '所在位置', '责任人', '设备状态'],
};
</script>

<template><CnasPage :page="page" /></template>
