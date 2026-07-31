// 集中状态容器 + localStorage 持久化 + 订阅通知
// 所有业务数据集合和会话状态集中管理，支持订阅变更通知。

const STORAGE_KEY = 'cnas-prototype-mainflow-v1';

// 默认会话状态（业务数据集合由 seed.js 注入）
function defaultSession() {
  return {
    loggedIn: false,
    role: '业务受理人员',
    currentCustomerId: null,
    currentCommissionId: null,
    currentSampleId: null,
    currentTaskId: null,
    currentReportId: null,
  };
}

// 持久化的业务数据集合容器
const collections = {
  customers: [],
  commissions: [],
  samples: [],
  tasks: [],
  records: [],
  reports: [],
  auditLog: [],
};

let state = loadState();
const listeners = new Set();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      session: { ...defaultSession(), ...(saved?.session || {}) },
      data: {
        customers: saved?.data?.customers || [],
        commissions: saved?.data?.commissions || [],
        samples: saved?.data?.samples || [],
        tasks: saved?.data?.tasks || [],
        records: saved?.data?.records || [],
        reports: saved?.data?.reports || [],
        auditLog: saved?.data?.auditLog || [],
      },
    };
  } catch {
    return { session: defaultSession(), data: { ...collections } };
  }
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('持久化失败', e);
  }
}

export function getState() {
  return state;
}

export function getSession() {
  return state.session;
}

export function getData() {
  return state.data;
}

export function updateSession(patch) {
  state.session = { ...state.session, ...patch };
  saveState();
  notify();
}

// 替换某个数据集合（用于初始化或重置）
export function setCollection(name, items) {
  if (name in collections) {
    state.data[name] = items;
    saveState();
    notify();
  }
}

// 直接更新数据集合并持久化（repository 使用）
export function mutateData(mutator) {
  mutator(state.data);
  saveState();
  notify();
}

// 审计日志写入
export function appendAudit(entry) {
  const auditEntry = {
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    actor: state.session.role || '系统',
    ...entry,
  };
  state.data.auditLog.unshift(auditEntry);
  if (state.data.auditLog.length > 100) {
    state.data.auditLog = state.data.auditLog.slice(0, 100);
  }
  saveState();
  notify();
}

// 订阅状态变更
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.warn('订阅回调异常', e);
    }
  });
}

// 重置全部状态（演示用）
export function resetState() {
  state = { session: defaultSession(), data: { ...collections } };
  saveState();
  notify();
}

// 仅重置会话（退出登录）
export function resetSession() {
  state.session = defaultSession();
  saveState();
  notify();
}
