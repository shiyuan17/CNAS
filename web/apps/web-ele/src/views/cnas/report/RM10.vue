<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM10', module: '报告更正', title: '报告撤回与作废', mode: 'approval',
  description: '评估已送达报告的风险和影响，执行停止使用、客户通知及替代关系控制。',
  fields: ['报告编号', '撤回原因', '风险等级', '影响客户', '已送达对象', '停止使用措施', '批准意见', '客户通知', '替代报告', '撤回状态'],
};
</script>

<template><CnasPage :page="page" /></template>
