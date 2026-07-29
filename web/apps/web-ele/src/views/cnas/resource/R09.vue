<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R09', module: '方法标准', title: '方法验证与确认', mode: 'form',
  description: '制定验证方案，汇总试验数据并经技术评价批准后投入使用。',
  fields: ['项目编号', '方法版本', '验证类型', '技术指标', '评价结论', '审批状态'],
};
</script>

<template><CnasPage :page="page" /></template>
