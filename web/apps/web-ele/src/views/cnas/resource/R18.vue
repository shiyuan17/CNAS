<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R18', module: '环境设施', title: '设施环境监控', mode: 'monitor',
  description: '配置监测点并采集环境数据，观察趋势、阈值和在线状态。',
  fields: ['监测点', '区域', '温度', '湿度', '控制限', '在线状态'],
};
</script>

<template><CnasPage :page="page" /></template>
