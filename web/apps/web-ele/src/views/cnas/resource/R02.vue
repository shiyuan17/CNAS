<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R02', module: '人员管理', title: '人员资质与经历', mode: 'detail',
  description: '登记资格和工作经历，保留证明文件、技术复核与有效期提醒。',
  fields: ['人员', '资格类型', '证书编号', '有效期', '工作经历', '复核状态'],
};
</script>

<template><CnasPage :page="page" /></template>
