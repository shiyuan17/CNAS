import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'CNASWorkbench',
    path: '/cnas/workbench',
    redirect: '/cnas/workbench/dashboard',
    meta: { icon: 'lucide:layout-dashboard', order: 1, title: '工作台' },
    children: [
      { name: 'WB02', path: 'dashboard', component: () => import('#/views/cnas/workbench/dashboard.vue'), meta: { icon: 'lucide:chart-no-axes-combined', title: '综合工作台' } },
      { name: 'WB03', path: 'todos', component: () => import('#/views/cnas/workbench/my-todos.vue'), meta: { icon: 'lucide:clipboard-list', title: '我的待办' } },
      { name: 'WB04', path: 'todo-action', component: () => import('#/views/cnas/workbench/todo-action.vue'), meta: { hideInMenu: true, title: '待办处理' } },
      { name: 'WB05', path: 'messages', component: () => import('#/views/cnas/workbench/message-center.vue'), meta: { icon: 'lucide:bell', title: '消息中心' } },
      { name: 'WB06', path: 'search', component: () => import('#/views/cnas/workbench/global-search.vue'), meta: { icon: 'lucide:search', title: '全局搜索' } },
      { name: 'WB07', path: 'profile', component: () => import('#/views/cnas/workbench/profile.vue'), meta: { icon: 'lucide:user-round', title: '个人中心' } },
    ],
  },
  {
    name: 'CNASCustomer',
    path: '/cnas/customer',
    redirect: '/cnas/customer/ledger',
    meta: { icon: 'lucide:handshake', order: 2, title: '客户与委托' },
    children: [
      { name: 'CC01', path: 'ledger', component: () => import('#/views/cnas/customer/customer-ledger.vue'), meta: { icon: 'lucide:users-round', title: '客户管理' } },
      { name: 'CC02', path: 'profile', component: () => import('#/views/cnas/customer/customer-profile.vue'), meta: { hideInMenu: true, title: '客户档案' } },
      { name: 'CC03', path: 'commissions', component: () => import('#/views/cnas/customer/commission-list.vue'), meta: { icon: 'lucide:files', title: '委托管理' } },
      { name: 'CC04', path: 'commission/new', component: () => import('#/views/cnas/customer/commission-wizard.vue'), meta: { hideInMenu: true, title: '新建委托向导' } },
      { name: 'CC05', path: 'commission/detail', component: () => import('#/views/cnas/customer/commission-detail.vue'), meta: { hideInMenu: true, title: '委托详情' } },
      { name: 'CC06', path: 'contract/quotation', component: () => import('#/views/cnas/customer/quotation-contract.vue'), meta: { hideInMenu: true, title: '报价与合同' } },
      { name: 'CC07', path: 'contract/review', component: () => import('#/views/cnas/customer/contract-review.vue'), meta: { hideInMenu: true, title: '合同评审' } },
      { name: 'CC08', path: 'commission/change-review', component: () => import('#/views/cnas/customer/commission-change-review.vue'), meta: { hideInMenu: true, title: '委托变更评审' } },
      { name: 'CC09', path: 'communication', component: () => import('#/views/cnas/customer/customer-communication.vue'), meta: { hideInMenu: true, title: '客户沟通与满意度' } },
    ],
  },
  {
    name: 'CNASSample',
    path: '/cnas/sample',
    redirect: '/cnas/sample/receiving-queue',
    meta: { icon: 'lucide:package-check', order: 3, title: '样品管理' },
    children: [
      { name: 'SM01', path: 'receiving-queue', component: () => import('#/views/cnas/sample/receiving-queue.vue'), meta: { icon: 'lucide:inbox', title: '样品接收' } },
      { name: 'SM02', path: 'receiving', component: () => import('#/views/cnas/sample/sample-receiving.vue'), meta: { hideInMenu: true, title: '样品接收工作台' } },
      { name: 'SM03', path: 'exception', component: () => import('#/views/cnas/sample/sample-exception.vue'), meta: { hideInMenu: true, title: '样品异常确认' } },
      { name: 'SM04', path: 'ledger', component: () => import('#/views/cnas/sample/sample-ledger.vue'), meta: { icon: 'lucide:archive', title: '样品台账' } },
      { name: 'SM05', path: 'trace', component: () => import('#/views/cnas/sample/sample-trace.vue'), meta: { hideInMenu: true, title: '样品详情与追踪' } },
      { name: 'SM06', path: 'labels', component: () => import('#/views/cnas/sample/sample-labels.vue'), meta: { hideInMenu: true, title: '样品标签管理' } },
      { name: 'SM07', path: 'aliquot', component: () => import('#/views/cnas/sample/aliquot-management.vue'), meta: { hideInMenu: true, title: '分样与子样管理' } },
      { name: 'SM08', path: 'handover', component: () => import('#/views/cnas/sample/sample-handover.vue'), meta: { hideInMenu: true, title: '样品交接' } },
      { name: 'SM09', path: 'storage', component: () => import('#/views/cnas/sample/sample-storage.vue'), meta: { hideInMenu: true, title: '样品存储与位置' } },
      { name: 'SM10', path: 'checkout', component: () => import('#/views/cnas/sample/sample-checkout.vue'), meta: { hideInMenu: true, title: '样品领用与归还' } },
      { name: 'SM11', path: 'retention', component: () => import('#/views/cnas/sample/sample-retention.vue'), meta: { hideInMenu: true, title: '留样管理' } },
      { name: 'SM12', path: 'disposal', component: () => import('#/views/cnas/sample/sample-disposal.vue'), meta: { hideInMenu: true, title: '样品处置' } },
    ],
  },
];

export default routes;
