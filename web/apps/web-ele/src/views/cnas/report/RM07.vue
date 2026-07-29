<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM07', module: '报告交付', title: '报告发布与送达', mode: 'workflow',
  description: '仅发布已签发版本，跟踪交付渠道、下载、签收、失败与重试记录。',
  fields: ['报告编号', '发布版本', '文件指纹', '交付方式', '收件人', '保密要求', '发布时间', '送达状态', '签收时间', '失败原因'],
};
</script>

<template><CnasPage :page="page" /></template>
