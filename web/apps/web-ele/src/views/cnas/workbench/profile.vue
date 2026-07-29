<script lang="ts" setup>
import type { CnasPageDefinition } from '#/cnas/types';
import CnasPage from '#/cnas/components/CnasPage.vue';
const page: CnasPageDefinition = { id: 'WB07', module: '个人中心', title: '个人中心', mode: 'detail', description: '查看本人组织岗位、能力范围、培训计划与消息偏好。', fields: ['姓名', '所属组织', '岗位信息', '能力范围', '培训计划', '电子签名状态', '消息偏好', '最近登录'] };
</script>
<template><CnasPage :page="page" /></template>
