<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R04', module: '培训管理', title: '培训执行与考核', mode: 'detail',
  description: '组织培训、记录签到和考核，评价有效性并归档培训记录。',
  fields: ['培训主题', '参训人员', '签到状态', '考核成绩', '评价结论', '完成状态'],
};
</script>

<template><CnasPage :page="page" /></template>
