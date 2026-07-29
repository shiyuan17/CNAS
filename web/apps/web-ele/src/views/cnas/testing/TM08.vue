<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM08', module: '任务管理', title: '检测资源核验', mode: 'workflow',
  description: '按实际检测时点核验人员、方法、设备、环境与物料资源并保存快照。',
  fields: ['人员授权', '方法版本', '设备状态', '校准有效期', '环境数据', '标准物质', '试剂批次', '核验时间', '核验结论'],
};
</script>

<template><CnasPage :page="page" /></template>
