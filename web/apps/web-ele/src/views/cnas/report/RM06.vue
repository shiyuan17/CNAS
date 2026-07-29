<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';

import CnasPage from '#/cnas/components/CnasPage.vue';

const page: CnasPageDefinition = {
  id: 'RM06', module: '报告签发', title: '认可标识与声明核验', mode: 'workflow',
  description: '匹配认可范围和签发场所，识别非认可、暂停与分包项目并生成受控声明。',
  fields: ['报告编号', '检测项目', '能力范围', '认可状态', '标识类型', '声明文本', '分包标识', '核验问题', '核验结论'],
};
</script>

<template><CnasPage :page="page" /></template>
