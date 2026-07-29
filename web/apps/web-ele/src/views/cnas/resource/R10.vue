<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'R10', module: '方法标准', title: '测量不确定度与判定规则', mode: 'detail',
  description: '维护不确定度模型与符合性判定规则，验证计算并受控发布。',
  fields: ['模型名称', '适用项目', '主要分量', '判定规则', '版本', '发布状态'],
};
</script>

<template><CnasPage :page="page" /></template>
