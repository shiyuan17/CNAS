<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'TM07', module: '原始记录', title: '数据计算与结果生成', mode: 'form',
  description: '使用锁定的计算模型生成结果，展示中间值、舍入过程及不确定度。',
  fields: ['原始数据', '计算模型', '公式版本', '参数值', '中间结果', '最终结果', '单位', '有效位数', '不确定度', '计算状态'],
};
</script>

<template><CnasPage :page="page" /></template>
