<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM05', module: '原始记录', title: '原始记录编辑器', mode: 'form',
  description: '按受控模板记录观察、读数、操作时间、设备与试剂批次，并完成自检签名。',
  fields: ['记录模板', '检测步骤', '原始读数', '单位', '计算公式', '环境数据', '设备信息', '试剂批次', '附件', '记录版本'],
};
</script>

<template><CnasPage :page="page" /></template>
