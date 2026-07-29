<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM09', module: '任务管理', title: '检测异常与暂停', mode: 'workflow',
  description: '受控暂停异常步骤，记录影响评价、临时措施和恢复批准条件。',
  fields: ['异常编号', '任务编号', '异常类型', '发生时间', '事实描述', '受影响数据', '临时措施', '影响评价', '恢复条件', '处理状态'],
};
</script>

<template><CnasPage :page="page" /></template>
