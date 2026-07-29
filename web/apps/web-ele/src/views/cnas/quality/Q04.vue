<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  description: '安排能力验证活动并跟踪实施。',
  fields: ["计划年度","领域项目","活动类型","组织方","计划时间","计划状态"],
  id: 'Q04',
  mode: 'schedule',
  module: '质量管理',
  title: '能力验证年度计划',
};
</script>

<template>
  <CnasPage :page="page" />
</template>

