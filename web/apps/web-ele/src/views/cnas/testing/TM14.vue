<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM14', module: '任务管理', title: '任务完成与归档', mode: 'workflow',
  description: '确认结果复核、质控、异常、样品去向和记录签名完成后生成归档清单。',
  fields: ['任务编号', '步骤完成度', '结果复核', '异常关闭', '样品归还', '附件完整性', '记录签名', '归档位置', '完成时间', '任务状态'],
};
</script>

<template><CnasPage :page="page" /></template>
