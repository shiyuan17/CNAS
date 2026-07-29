<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R25', module: '分包管理', title: '分包评审与客户同意', mode: 'approval',
  description: '评审分包方能力与责任，取得客户同意并批准执行。',
  fields: ['评审编号', '委托项目', '分包方', '能力范围', '客户同意', '评审结论'],
};
</script>

<template><CnasPage :page="page" /></template>
