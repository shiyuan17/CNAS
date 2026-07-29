<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM03', module: '报告编制', title: '报告预览与完整性检查', mode: 'detail',
  description: '以拟发布格式预览报告，核对数据一致性、分页、附件与签名位置。',
  fields: ['报告预览', '完整性清单', '数据一致性', '分页状态', '附件状态', '签名位置', '标识状态', '检查结果'],
};
</script>

<template><CnasPage :page="page" /></template>
