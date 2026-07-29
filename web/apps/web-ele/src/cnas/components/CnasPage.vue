<script lang="ts" setup>
import type { CnasPageDefinition } from '../types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElStep,
  ElSteps,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

const props = defineProps<{ page: CnasPageDefinition }>();

type CnasDemoRow = {
  id: string;
  owner: string;
  status: string;
  updatedAt: string;
  value: string;
};

const router = useRouter();
const query = ref('');
const status = ref('全部状态');
const detailVisible = ref(false);
const editorVisible = ref(false);
const activeRow = ref<CnasDemoRow | null>(null);
const form = ref({ comment: '', title: '' });

const storageKey = computed(() => `cnas-demo:${props.page.id}`);
const rows = ref(loadRows());

function loadRows() {
  const saved = localStorage.getItem(`cnas-demo:${props.page.id}`);
  if (saved) {
    try {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const validRows = parsed.filter(
          (row): row is CnasDemoRow =>
            !!row &&
            typeof row === 'object' &&
            ['id', 'owner', 'status', 'updatedAt', 'value'].every(
              (key) => typeof (row as Record<string, unknown>)[key] === 'string',
            ),
        );
        if (validRows.length > 0) {
          return validRows;
        }
      }
    } catch {
      localStorage.removeItem(`cnas-demo:${props.page.id}`);
    }
  }
  return Array.from({ length: 8 }, (_, index) => ({
    id: `${props.page.id}-${String(index + 1).padStart(3, '0')}`,
    owner: ['张晨', '李敏', '王磊', '陈琳'][index % 4]!,
    status: ['进行中', '待处理', '已完成', '待复核'][index % 4]!,
    updatedAt: `2026-07-${String(29 - index).padStart(2, '0')} ${String(9 + index).padStart(2, '0')}:30`,
    value: `${props.page.title}示例数据 ${index + 1}`,
  }));
}

function persist() {
  localStorage.setItem(storageKey.value, JSON.stringify(rows.value));
}

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    const matchesQuery = !query.value || Object.values(row).some((value) => value.includes(query.value));
    const matchesStatus = status.value === '全部状态' || row.status === status.value;
    return matchesQuery && matchesStatus;
  }),
);

const isDashboard = computed(() => props.page.mode === 'dashboard');
const isDetail = computed(() => props.page.mode === 'detail');
const isWorkflow = computed(() => ['approval', 'workflow', 'wizard'].includes(props.page.mode));

function openDetail(row: CnasDemoRow) {
  activeRow.value = row;
  detailVisible.value = true;
}

function openEditor(row?: CnasDemoRow) {
  activeRow.value = row ?? null;
  form.value = { comment: '', title: row?.value ?? '' };
  editorVisible.value = true;
}

function saveRecord() {
  const value = form.value.title.trim() || `${props.page.title}新增记录`;
  if (activeRow.value) {
    activeRow.value.value = value;
    activeRow.value.status = '进行中';
  } else {
    rows.value.unshift({
      id: `${props.page.id}-${String(rows.value.length + 1).padStart(3, '0')}`,
      owner: '演示管理员',
      status: '待处理',
      updatedAt: '刚刚',
      value,
    });
  }
  persist();
  editorVisible.value = false;
  ElMessage.success('已保存本地演示数据');
}

function runAction(row: CnasDemoRow, nextStatus: string) {
  row.status = nextStatus;
  row.updatedAt = '刚刚';
  persist();
  ElMessage.success(`已更新为${nextStatus}`);
}

function resetFilters() {
  query.value = '';
  status.value = '全部状态';
}

function navigateTo(id: string) {
  router.push({ name: id }).catch(() => undefined);
}
</script>

<template>
  <main class="cnas-page">
    <header class="cnas-page__header">
      <div>
        <div class="cnas-page__eyebrow">{{ page.module }} / {{ page.id }}</div>
        <h1>{{ page.title }}</h1>
        <p>{{ page.description }}</p>
      </div>
      <div class="cnas-page__actions">
        <el-button v-if="isWorkflow" plain type="primary" @click="navigateTo('WB03')">查看待办</el-button>
        <el-button type="primary" @click="openEditor()">新建记录</el-button>
      </div>
    </header>

    <section v-if="isDashboard" class="cnas-metrics" aria-label="业务指标">
      <article v-for="(field, index) in page.fields.slice(0, 4)" :key="field" class="cnas-metric">
        <span>{{ field }}</span>
        <strong>{{ [24, 8, 96, 3][index] }}</strong>
        <small :class="index === 3 ? 'is-warning' : 'is-positive'">{{ index === 3 ? '需要关注' : '较昨日更新' }}</small>
      </article>
    </section>

    <section v-if="isDetail" class="cnas-detail-grid">
      <article v-for="field in page.fields" :key="field" class="cnas-detail-field">
        <span>{{ field }}</span><strong>{{ page.title }}示例信息</strong>
      </article>
    </section>

    <section class="cnas-panel">
      <div class="cnas-filter-bar">
        <el-input v-model="query" clearable placeholder="搜索编号、名称或责任人" class="cnas-search" />
        <el-select v-model="status" class="cnas-status">
          <el-option label="全部状态" value="全部状态" />
          <el-option label="待处理" value="待处理" />
          <el-option label="进行中" value="进行中" />
          <el-option label="待复核" value="待复核" />
          <el-option label="已完成" value="已完成" />
        </el-select>
        <el-button @click="resetFilters">重置</el-button>
        <span class="cnas-result-count">共 {{ filteredRows.length }} 条</span>
      </div>

      <el-table :data="filteredRows" class="cnas-table" stripe>
        <el-table-column label="业务编号" min-width="150" prop="id" />
        <el-table-column :label="page.fields[0] || '业务摘要'" min-width="220" prop="value" show-overflow-tooltip />
        <el-table-column label="责任人" min-width="110" prop="owner" />
        <el-table-column label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : scope.row.status === '待复核' ? 'warning' : 'primary'" effect="light">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="150" prop="updatedAt" />
        <el-table-column fixed="right" label="操作" min-width="190">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">查看</el-button>
            <el-button link type="primary" @click="openEditor(scope.row)">编辑</el-button>
            <el-button v-if="isWorkflow" link type="success" @click="runAction(scope.row, '已完成')">提交</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section v-if="isWorkflow" class="cnas-panel cnas-timeline-panel">
      <h2>流程轨迹</h2>
      <el-steps :active="2" finish-status="success" simple>
        <el-step title="业务发起" />
        <el-step title="资料核验" />
        <el-step title="审批处理" />
        <el-step title="归档完成" />
      </el-steps>
    </section>

    <el-drawer v-model="detailVisible" title="业务详情" size="520px">
      <template v-if="activeRow">
        <dl class="cnas-drawer-detail">
          <template v-for="field in page.fields" :key="field">
            <dt>{{ field }}</dt><dd>{{ activeRow.value }}</dd>
          </template>
          <dt>当前状态</dt><dd>{{ activeRow.status }}</dd>
          <dt>责任人</dt><dd>{{ activeRow.owner }}</dd>
        </dl>
      </template>
    </el-drawer>

    <el-dialog v-model="editorVisible" :title="activeRow ? `编辑${page.title}` : `新建${page.title}`" width="560px">
      <el-form label-position="top">
        <el-form-item :label="page.fields[0] || '业务摘要'" required>
          <el-input v-model="form.title" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="form.comment" :rows="4" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="editorVisible = false">取消</el-button><el-button type="primary" @click="saveRecord">保存</el-button></template>
    </el-dialog>
  </main>
</template>

<style scoped>
.cnas-page { min-width: 0; padding: 20px; color: #1f2937; }
.cnas-page__header { display: flex; min-height: 88px; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
.cnas-page__header h1 { margin: 4px 0; font-size: 24px; font-weight: 650; line-height: 1.35; }
.cnas-page__header p { max-width: 780px; margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; }
.cnas-page__eyebrow { color: #0f766e; font-size: 12px; font-weight: 600; }
.cnas-page__actions { display: flex; flex: none; gap: 8px; }
.cnas-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.cnas-metric, .cnas-panel, .cnas-detail-field { border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; }
.cnas-metric { min-height: 116px; padding: 16px; }
.cnas-metric span, .cnas-metric small { display: block; color: #64748b; font-size: 13px; }
.cnas-metric strong { display: block; margin: 10px 0 6px; font-size: 28px; }
.is-positive { color: #15803d !important; }.is-warning { color: #b45309 !important; }
.cnas-detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.cnas-detail-field { min-height: 80px; padding: 14px; }.cnas-detail-field span { display: block; color: #64748b; font-size: 12px; }.cnas-detail-field strong { display: block; margin-top: 8px; font-size: 14px; font-weight: 550; }
.cnas-panel { overflow: hidden; margin-bottom: 16px; }.cnas-filter-bar { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }.cnas-search { width: min(360px, 42vw); }.cnas-status { width: 128px; }.cnas-result-count { margin-left: auto; color: #64748b; font-size: 13px; }.cnas-table { width: 100%; }.cnas-timeline-panel { padding: 16px; }.cnas-timeline-panel h2 { margin: 0 0 16px; font-size: 16px; }.cnas-drawer-detail { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 14px 12px; margin: 0; }.cnas-drawer-detail dt { color: #64748b; }.cnas-drawer-detail dd { overflow-wrap: anywhere; margin: 0; }
@media (max-width: 900px) { .cnas-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }.cnas-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.cnas-page__header { flex-direction: column; }.cnas-filter-bar { align-items: stretch; flex-wrap: wrap; }.cnas-result-count { margin-left: 0; }.cnas-search { width: 100%; } }
</style>
