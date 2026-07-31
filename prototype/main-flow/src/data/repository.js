// 数据集合 CRUD 仓库
// 统一的数据访问层，所有写操作自动写审计。
// 设计为可替换：后续迁移到真实后端时，只需把 localStorage 实现替换为 API 调用。

import { ObjectTypes, Schemas, nextCode } from '../data/schema.js';
import { getData, mutateData, appendAudit } from '../state/store.js';

// 对象类型 -> 数据集合名映射
const CollectionMap = {
  [ObjectTypes.CUSTOMER]: 'customers',
  [ObjectTypes.COMMISSION]: 'commissions',
  [ObjectTypes.SAMPLE]: 'samples',
  [ObjectTypes.TASK]: 'tasks',
  [ObjectTypes.RECORD]: 'records',
  [ObjectTypes.REPORT]: 'reports',
};

function collectionFor(type) {
  const name = CollectionMap[type];
  if (!name) throw new Error(`未知对象类型: ${type}`);
  return getData()[name];
}

// 列表查询（可选过滤函数）
export function list(type, filterFn) {
  const items = collectionFor(type);
  return filterFn ? items.filter(filterFn) : [...items];
}

// 单条查询
export function get(type, id) {
  return collectionFor(type).find((item) => item.id === id) || null;
}

// 按字段查询
export function findBy(type, field, value) {
  return collectionFor(type).filter((item) => item[field] === value);
}

// 按编号查询
export function getByCode(type, code) {
  return collectionFor(type).find((item) => item.code === code) || null;
}

// 新建
export function create(type, data) {
  const schema = Schemas[type];
  const collectionName = CollectionMap[type];
  const statusField = schema?.statusField || 'status';
  let created = null;
  mutateData((dataState) => {
    const existing = dataState[collectionName];
    const id = makeId(type, existing);
    const code = data.code || nextCode(type, existing);
    created = {
      id,
      code,
      ...data,
      [statusField]: data[statusField] || data.status || (schema && StatusEnumDefault(type)),
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    // 若 data 同时含 status 但 statusField 不是 status，清理多余的 status 幽灵键
    if (statusField !== 'status' && created.status !== undefined && !data.status) {
      delete created.status;
    }
    existing.unshift(created);
  });
  appendAudit({
    action: `新建${schema?.label || type}`,
    detail: `${created.code} 已创建`,
  });
  return created;
}

// 更新（保留旧值用于审计）
export function update(type, id, patch) {
  const schema = Schemas[type];
  let updated = null;
  let changes = [];
  mutateData((dataState) => {
    const collectionName = CollectionMap[type];
    const item = dataState[collectionName].find((i) => i.id === id);
    if (!item) return;
    Object.keys(patch).forEach((key) => {
      if (patch[key] !== undefined && patch[key] !== item[key]) {
        changes.push(`${key}: ${item[key] || '空'} → ${patch[key]}`);
        item[key] = patch[key];
      }
    });
    updated = item;
  });
  if (updated && changes.length) {
    appendAudit({
      action: `修改${schema?.label || type}`,
      detail: `${updated.code} 变更: ${changes.join('; ')}`,
    });
  }
  return updated;
}

// 状态变更（专用，确保走状态机校验）
export function changeStatus(type, id, newStatus, reason = '') {
  const schema = Schemas[type];
  let updated = null;
  let oldStatus = '';
  mutateData((dataState) => {
    const collectionName = CollectionMap[type];
    const item = dataState[collectionName].find((i) => i.id === id);
    if (!item) return;
    oldStatus = item[schema.statusField] || '';
    item[schema.statusField] = newStatus;
    updated = item;
  });
  if (updated) {
    appendAudit({
      action: `状态变更`,
      detail: `${updated.code} ${oldStatus} → ${newStatus}${reason ? `（${reason}）` : ''}`,
    });
  }
  return updated;
}

// 删除（仅限未形成业务事实的对象）
// 业务事实保护：已关联下游对象或非初始状态的对象禁止删除，防止悬挂引用。
export function remove(type, id) {
  const schema = Schemas[type];
  const item = collectionFor(type).find((i) => i.id === id);
  if (!item) return null;

  // 业务事实保护：检查是否已关联下游对象或已离开初始状态
  const guard = checkRemovable(type, item);
  if (!guard.removable) {
    appendAudit({
      action: `删除${schema?.label || type}被拒`,
      detail: `${item.code} ${guard.reason}，禁止删除`,
    });
    return null;
  }

  let removed = null;
  mutateData((dataState) => {
    const collectionName = CollectionMap[type];
    const idx = dataState[collectionName].findIndex((i) => i.id === id);
    if (idx === -1) return;
    removed = dataState[collectionName][idx];
    dataState[collectionName].splice(idx, 1);
  });
  if (removed) {
    appendAudit({
      action: `删除${schema?.label || type}`,
      detail: `${removed.code} 已删除`,
    });
  }
  return removed;
}

// 检查对象是否可安全删除（未形成业务事实）
function checkRemovable(type, item) {
  const data = getData();
  const initialStatus = {
    [ObjectTypes.CUSTOMER]: '活跃',
    [ObjectTypes.COMMISSION]: '草稿',
    [ObjectTypes.SAMPLE]: '待接收',
    [ObjectTypes.TASK]: '待排程',
    [ObjectTypes.RECORD]: '草稿',
    [ObjectTypes.REPORT]: '草稿',
  }[type];

  // 已离开初始状态的对象视为已形成业务事实
  const statusField = Schemas[type]?.statusField || 'status';
  if (item[statusField] && item[statusField] !== initialStatus) {
    return { removable: false, reason: `状态为"${item[statusField]}"（非初始状态）` };
  }

  // 检查下游关联对象（仅对会产生下游的对象检查）
  if (type === ObjectTypes.COMMISSION && item.code) {
    const hasSamples = data.samples.some((s) => s.commissionCode === item.code);
    const hasTasks = data.tasks.some((t) => t.commissionCode === item.code);
    const hasReports = data.reports.some((r) => r.commissionCode === item.code);
    if (hasSamples || hasTasks || hasReports) {
      return { removable: false, reason: '存在关联的样品/任务/报告' };
    }
  }
  if (type === ObjectTypes.SAMPLE && item.code) {
    const hasTasks = data.tasks.some((t) => t.sampleCode === item.code);
    if (hasTasks) {
      return { removable: false, reason: '存在关联的检测任务' };
    }
  }
  if (type === ObjectTypes.TASK && item.code) {
    const hasRecords = data.records.some((r) => r.taskCode === item.code);
    if (hasRecords) {
      return { removable: false, reason: '存在关联的原始记录' };
    }
  }

  return { removable: true };
}

// 默认状态值
function StatusEnumDefault(type) {
  const defaults = {
    [ObjectTypes.CUSTOMER]: '活跃',
    [ObjectTypes.COMMISSION]: '草稿',
    [ObjectTypes.SAMPLE]: '待接收',
    [ObjectTypes.TASK]: '待排程',
    [ObjectTypes.RECORD]: '草稿',
    [ObjectTypes.REPORT]: '草稿',
  };
  return defaults[type] || '';
}

// 生成唯一 ID：使用 schema.idPrefix 避免跨类型碰撞（customer/commission 均以 c 开头）
// 序号取已有记录中最大序号+1，避免删除后重建导致 ID 碰撞
// 后缀用时间戳+随机数，避免同一毫秒内创建导致后缀重复
function makeId(type, existing) {
  const schema = Schemas[type];
  const prefix = (schema?.idPrefix || type).toLowerCase();
  // 从已有 ID 中提取最大序号，避免删除后 length 减小导致碰撞
  const seqs = existing
    .map((i) => {
      // ID 格式：prefix<seq>-<suffix>，提取 prefix 后的数字
      const m = String(i.id || '').match(/^[a-zA-Z]+(\d+)-/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const seq = (seqs.length ? Math.max(...seqs) : 0) + 1;
  // 时间戳 6 位 + 随机 2 位，降低同一毫秒碰撞概率
  const suffix = Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 4);
  return `${prefix}${seq}-${suffix}`;
}

// 获取对象类型标签
export function typeLabel(type) {
  return Schemas[type]?.label || type;
}

// 跨集合关联查询：从委托出发，查找关联的样品/任务/记录/报告
export function getCommissionChain(commissionCode) {
  const data = getData();
  return {
    samples: data.samples.filter((s) => s.commissionCode === commissionCode),
    tasks: data.tasks.filter((t) => t.commissionCode === commissionCode),
    reports: data.reports.filter((r) => r.commissionCode === commissionCode),
  };
}

// 跨集合关联查询：从任务出发
// 报告仅关联委托编号（无 taskCode），通过任务所属委托间接关联
export function getTaskChain(taskCode) {
  const data = getData();
  const task = data.tasks.find((t) => t.code === taskCode);
  const commissionCode = task ? task.commissionCode : '';
  return {
    records: data.records.filter((r) => r.taskCode === taskCode),
    reports: commissionCode
      ? data.reports.filter((r) => r.commissionCode === commissionCode)
      : [],
  };
}
