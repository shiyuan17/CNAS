<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM05', module: '报告签发', title: '授权签发', mode: 'approval',
  description: '校验签字授权范围、认可标识与关键意见后完成电子签名和签发。',
  fields: ['报告摘要', '授权范围', '认可标识', '分包结果', '偏离说明', '风险提示', '审核结论', '签发意见', '电子签名', '签发状态'],
};
</script>

<template><CnasPage :page="page" /></template>
