import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:badge-check',
      order: 6,
      title: '质量管理',
    },
    name: 'CnasQuality',
    path: '/cnas/quality',
    redirect: '/cnas/quality/quality-control-plan',
    children: [
      {
        component: () => import('#/views/cnas/quality/Q01.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '质量控制计划',
        },
        name: 'Q01',
        path: 'quality-control-plan',
      },
      {
        component: () => import('#/views/cnas/quality/Q02.vue'),
        meta: {
                   hideInMenu: true,
          title: '质控结果与趋势',
        },
        name: 'Q02',
        path: 'quality-results-trend',
      },
      {
        component: () => import('#/views/cnas/quality/Q03.vue'),
        meta: {
                   hideInMenu: true,
          title: '质控失控调查',
        },
        name: 'Q03',
        path: 'quality-out-of-control',
      },
      {
        component: () => import('#/views/cnas/quality/Q04.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '能力验证年度计划',
        },
        name: 'Q04',
        path: 'proficiency-testing-plan',
      },
      {
        component: () => import('#/views/cnas/quality/Q05.vue'),
        meta: {
                   hideInMenu: true,
          title: '能力验证实施与评价',
        },
        name: 'Q05',
        path: 'proficiency-testing-review',
      },
      {
        component: () => import('#/views/cnas/quality/Q06.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '质量事件中心',
        },
        name: 'Q06',
        path: 'quality-event-center',
      },
      {
        component: () => import('#/views/cnas/quality/Q07.vue'),
        meta: {
                   hideInMenu: true,
          title: '投诉与申诉处理',
        },
        name: 'Q07',
        path: 'complaint-appeal',
      },
      {
        component: () => import('#/views/cnas/quality/Q08.vue'),
        meta: {
                   hideInMenu: true,
          title: '不符合工作控制',
        },
        name: 'Q08',
        path: 'nonconforming-work',
      },
      {
        component: () => import('#/views/cnas/quality/Q09.vue'),
        meta: {
          icon: 'lucide:circle',
          title: 'CAPA 计划与执行',
        },
        name: 'Q09',
        path: 'capa-plan',
      },
      {
        component: () => import('#/views/cnas/quality/Q10.vue'),
        meta: {
                   hideInMenu: true,
          title: 'CAPA 有效性验证',
        },
        name: 'Q10',
        path: 'capa-effectiveness',
      },
      {
        component: () => import('#/views/cnas/quality/Q11.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '风险与机遇台账',
        },
        name: 'Q11',
        path: 'risk-register',
      },
      {
        component: () => import('#/views/cnas/quality/Q12.vue'),
        meta: {
                   hideInMenu: true,
          title: '风险评价与措施跟踪',
        },
        name: 'Q12',
        path: 'risk-actions',
      }
    ],
  },
  {
    meta: {
      icon: 'lucide:book-open-check',
      order: 7,
      title: '体系管理',
    },
    name: 'CnasGovernance',
    path: '/cnas/governance',
    redirect: '/cnas/governance/controlled-documents',
    children: [
      {
        component: () => import('#/views/cnas/governance/GOV01.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '受控文件库',
        },
        name: 'GOV01',
        path: 'controlled-documents',
      },
      {
        component: () => import('#/views/cnas/governance/GOV02.vue'),
        meta: {
                   hideInMenu: true,
          title: '文件编制与修订',
        },
        name: 'GOV02',
        path: 'document-revision',
      },
      {
        component: () => import('#/views/cnas/governance/GOV03.vue'),
        meta: {
                   hideInMenu: true,
          title: '文件审核与批准',
        },
        name: 'GOV03',
        path: 'document-approval',
      },
      {
        component: () => import('#/views/cnas/governance/GOV04.vue'),
        meta: {
                   hideInMenu: true,
          title: '文件发布与分发',
        },
        name: 'GOV04',
        path: 'document-distribution',
      },
      {
        component: () => import('#/views/cnas/governance/GOV05.vue'),
        meta: {
                   hideInMenu: true,
          title: '外来文件管理',
        },
        name: 'GOV05',
        path: 'external-documents',
      },
      {
        component: () => import('#/views/cnas/governance/GOV06.vue'),
        meta: {
                   hideInMenu: true,
          title: '文件作废与回收',
        },
        name: 'GOV06',
        path: 'document-retirement',
      },
      {
        component: () => import('#/views/cnas/governance/GOV07.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '记录模板与清单',
        },
        name: 'GOV07',
        path: 'record-templates',
      },
      {
        component: () => import('#/views/cnas/governance/GOV08.vue'),
        meta: {
                   hideInMenu: true,
          title: '记录归档',
        },
        name: 'GOV08',
        path: 'record-archiving',
      },
      {
        component: () => import('#/views/cnas/governance/GOV09.vue'),
        meta: {
                   hideInMenu: true,
          title: '档案借阅与销毁',
        },
        name: 'GOV09',
        path: 'archive-loan-destruction',
      },
      {
        component: () => import('#/views/cnas/governance/GOV10.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '内部审核计划',
        },
        name: 'GOV10',
        path: 'internal-audit-plan',
      },
      {
        component: () => import('#/views/cnas/governance/GOV11.vue'),
        meta: {
                   hideInMenu: true,
          title: '内部审核执行',
        },
        name: 'GOV11',
        path: 'internal-audit-execution',
      },
      {
        component: () => import('#/views/cnas/governance/GOV12.vue'),
        meta: {
                   hideInMenu: true,
          title: '审核发现与整改',
        },
        name: 'GOV12',
        path: 'audit-findings',
      },
      {
        component: () => import('#/views/cnas/governance/GOV13.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '管理评审计划',
        },
        name: 'GOV13',
        path: 'management-review-plan',
      },
      {
        component: () => import('#/views/cnas/governance/GOV14.vue'),
        meta: {
                   hideInMenu: true,
          title: '管理评审执行与措施',
        },
        name: 'GOV14',
        path: 'management-review-actions',
      },
      {
        component: () => import('#/views/cnas/governance/GOV15.vue'),
        meta: {
                   hideInMenu: true,
          title: '质量事件与持续改进',
        },
        name: 'GOV15',
        path: 'continual-improvement',
      }
    ],
  },
  {
    meta: {
      icon: 'lucide:award',
      order: 8,
      title: '认可管理',
    },
    name: 'CnasAccreditation',
    path: '/cnas/accreditation',
    redirect: '/cnas/accreditation/accreditation-register',
    children: [
      {
        component: () => import('#/views/cnas/accreditation/ACC01.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '认可项目台账',
        },
        name: 'ACC01',
        path: 'accreditation-register',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC02.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '认可范围管理',
        },
        name: 'ACC02',
        path: 'accreditation-scope',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC03.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '授权签字人管理',
        },
        name: 'ACC03',
        path: 'authorized-signatories',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC04.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '认可条款自查',
        },
        name: 'ACC04',
        path: 'accreditation-self-check',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC05.vue'),
        meta: {
                   hideInMenu: true,
          title: '申请材料与证据包',
        },
        name: 'ACC05',
        path: 'application-evidence',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC06.vue'),
        meta: {
                   hideInMenu: true,
          title: '评审计划与迎审任务',
        },
        name: 'ACC06',
        path: 'assessment-plan',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC07.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '评审问题与整改',
        },
        name: 'ACC07',
        path: 'assessment-corrective-actions',
      },
      {
        component: () => import('#/views/cnas/accreditation/ACC08.vue'),
        meta: {
                   hideInMenu: true,
          title: '认可证书与变更',
        },
        name: 'ACC08',
        path: 'certificate-changes',
      }
    ],
  },
  {
    meta: {
      icon: 'lucide:settings',
      order: 9,
      title: '系统管理',
    },
    name: 'CnasSystem',
    path: '/cnas/system',
    redirect: '/cnas/system/organization',
    children: [
      {
        component: () => import('#/views/cnas/system/SYS01.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '组织管理',
        },
        name: 'SYS01',
        path: 'organization',
      },
      {
        component: () => import('#/views/cnas/system/SYS02.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '用户管理',
        },
        name: 'SYS02',
        path: 'users',
      },
      {
        component: () => import('#/views/cnas/system/SYS03.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '角色管理',
        },
        name: 'SYS03',
        path: 'roles',
      },
      {
        component: () => import('#/views/cnas/system/SYS04.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '权限管理',
        },
        name: 'SYS04',
        path: 'permissions',
      },
      {
        component: () => import('#/views/cnas/system/SYS05.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '审计日志',
        },
        name: 'SYS05',
        path: 'audit-log',
      },
      {
        component: () => import('#/views/cnas/system/SYS06.vue'),
        meta: {
                   hideInMenu: true,
          title: '登录与会话管理',
        },
        name: 'SYS06',
        path: 'sessions',
      },
      {
        component: () => import('#/views/cnas/system/SYS07.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '工作流配置',
        },
        name: 'SYS07',
        path: 'workflow-config',
      },
      {
        component: () => import('#/views/cnas/system/SYS08.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '编号规则',
        },
        name: 'SYS08',
        path: 'numbering-rules',
      },
      {
        component: () => import('#/views/cnas/system/SYS09.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '模板管理',
        },
        name: 'SYS09',
        path: 'templates',
      },
      {
        component: () => import('#/views/cnas/system/SYS10.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '消息配置',
        },
        name: 'SYS10',
        path: 'message-config',
      },
      {
        component: () => import('#/views/cnas/system/SYS11.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '数据字典',
        },
        name: 'SYS11',
        path: 'data-dictionary',
      },
      {
        component: () => import('#/views/cnas/system/SYS12.vue'),
        meta: {
                   hideInMenu: true,
          title: '用户角色授权',
        },
        name: 'SYS12',
        path: 'user-role-grants',
      },
      {
        component: () => import('#/views/cnas/system/SYS13.vue'),
        meta: {
                   hideInMenu: true,
          title: '工作流设计',
        },
        name: 'SYS13',
        path: 'workflow-designer',
      },
      {
        component: () => import('#/views/cnas/system/SYS14.vue'),
        meta: {
                   hideInMenu: true,
          title: '模板编辑与预览',
        },
        name: 'SYS14',
        path: 'template-editor',
      },
      {
        component: () => import('#/views/cnas/system/SYS15.vue'),
        meta: {
          icon: 'lucide:circle',
          title: '接口监控',
        },
        name: 'SYS15',
        path: 'integration-monitor',
      },
      {
        component: () => import('#/views/cnas/system/SYS16.vue'),
        meta: {
                   hideInMenu: true,
          title: '接口失败详情',
        },
        name: 'SYS16',
        path: 'integration-failure',
      }
    ],
  }
];

export default routes;

