<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R01', module: '人员管理', title: '人员档案', mode: 'list',
  description: '查询人员档案，维护岗位、专业组、经历和在岗状态，并提交复核。',
  fields: ['人员编号', '姓名', '岗位', '专业组', '入职日期', '在岗状态'],
};
</script>

<template><CnasPage :page="page" /></template>
