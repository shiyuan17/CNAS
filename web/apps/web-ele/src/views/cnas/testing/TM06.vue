<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM06', module: '仪器数据', title: '仪器数据导入', mode: 'form',
  description: '校验原始文件、仪器与采集时间，映射样品并保留完整性校验及导入记录。',
  fields: ['文件名称', '仪器编号', '采集时间', '方法标识', '样品映射', '数据条数', '校验结果', '差异说明', '导入状态'],
};
</script>

<template><CnasPage :page="page" /></template>
