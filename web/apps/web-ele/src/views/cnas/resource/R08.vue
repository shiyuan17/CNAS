<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R08', module: '方法标准', title: '标准查新与版本', mode: 'detail',
  description: '识别标准替代和变更，完成影响评价、方法更新及相关人员通知。',
  fields: ['标准号', '现行版本', '替代版本', '查新日期', '影响范围', '处置状态'],
};
</script>

<template><CnasPage :page="page" /></template>
