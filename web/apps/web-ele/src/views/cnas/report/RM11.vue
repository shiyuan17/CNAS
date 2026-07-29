<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM11', module: '报告交付', title: '报告归档与调阅', mode: 'workflow',
  description: '归档有效版本和送达证据，受控处理调阅申请、水印副本和下载记录。',
  fields: ['档案编号', '报告编号', '归档版本', '归档内容', '保存期限', '保密等级', '归档位置', '调阅申请', '下载水印', '档案状态'],
};
</script>

<template><CnasPage :page="page" /></template>
