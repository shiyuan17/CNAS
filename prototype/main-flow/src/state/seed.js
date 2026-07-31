// 初始虚构业务数据（种子）
// 所有数据均为虚构演示数据，非真实客户/样品/报告。
// 角色姓名为虚构：张晨(受理)、李敏(样品)、王磊(检测)、陈琳(复核)、赵刚(技术负责人)、孙芳(授权签字)

export function getSeedData() {
  return {
    customers: [
      { id: 'c1', code: 'CUS-0001', name: '清源环境科技有限公司', type: '企业', contact: '刘伟', phone: '138-0001-1001', creditStatus: '正常', confidentiality: '内部', cooperationStatus: '活跃', createdAt: '2026-06-15 09:20' },
      { id: 'c2', code: 'CUS-0002', name: '市疾控中心卫生检验所', type: '政府机构', contact: '周静', phone: '021-8800-2002', creditStatus: '正常', confidentiality: '机密', cooperationStatus: '活跃', createdAt: '2026-06-20 14:10' },
      { id: 'c3', code: 'CUS-0003', name: '恒达精密仪器制造厂', type: '企业', contact: '吴强', phone: '139-0003-3003', creditStatus: '关注', confidentiality: '内部', cooperationStatus: '活跃', createdAt: '2026-07-01 10:30' },
    ],

    commissions: [
      { id: 'cm1', code: 'COMM-2026-0001', customerId: 'c1', customerName: '清源环境科技有限公司', type: '检测', sampleCount: 3, expectedDate: '2026-08-10', reviewProgress: '已通过', owner: '张晨', status: '已受理', requirements: '饮用水水质全项检测，含pH/重金属/微生物', quotationAmount: '¥4,800', contractVersion: 'V1', reviewConclusion: '通过', createdAt: '2026-07-20 09:15' },
      { id: 'cm2', code: 'COMM-2026-0002', customerId: 'c2', customerName: '市疾控中心卫生检验所', type: '检测', sampleCount: 5, expectedDate: '2026-08-15', reviewProgress: '待评审', owner: '张晨', status: '待评审', requirements: '食品接触材料迁移量检测', reviewConclusion: '待评审', createdAt: '2026-07-25 11:00' },
      { id: 'cm3', code: 'COMM-2026-0003', customerId: 'c3', customerName: '恒达精密仪器制造厂', type: '校准', sampleCount: 2, expectedDate: '2026-08-20', reviewProgress: '草稿', owner: '张晨', status: '草稿', requirements: '卡尺/千分尺外校准', reviewConclusion: '待评审', createdAt: '2026-07-28 15:30' },
    ],

    samples: [
      { id: 's1', code: 'SMP-0001', name: '饮用水-自来水', commissionCode: 'COMM-2026-0001', quantity: '3瓶×500ml', packageStatus: '完好', transportCondition: '常温', receivedAt: '2026-07-22 10:00', receivedBy: '李敏', receiveConclusion: '正常接收', location: '样品库A-01', parentId: '', retentionDeadline: '2026-08-22', status: '已交接', createdAt: '2026-07-22 10:00' },
      { id: 's2', code: 'SMP-0002', name: '饮用水-纯净水', commissionCode: 'COMM-2026-0001', quantity: '3瓶×500ml', packageStatus: '完好', transportCondition: '常温', receivedAt: '2026-07-22 10:05', receivedBy: '李敏', receiveConclusion: '正常接收', location: '样品库A-02', parentId: '', retentionDeadline: '2026-08-22', status: '已领用', createdAt: '2026-07-22 10:05' },
      { id: 's3', code: 'SMP-0003', name: '待接收样品', commissionCode: 'COMM-2026-0002', quantity: '5份', packageStatus: '完好', transportCondition: '常温', receivedAt: '', receivedBy: '', receiveConclusion: '', location: '', parentId: '', retentionDeadline: '', status: '待接收', createdAt: '2026-07-28 09:00' },
    ],

    tasks: [
      { id: 't1', code: 'TASK-2026-0001', commissionCode: 'COMM-2026-0001', sampleCode: 'SMP-0001', testItems: 'pH、铅、镉、总大肠菌群', method: 'GB/T 5750', plannedDate: '2026-07-25', executor: '王磊', reviewer: '陈琳', progress: '执行中', resourceValid: '通过', exceptionFlag: '', status: '待复核', createdAt: '2026-07-23 09:00' },
      { id: 't2', code: 'TASK-2026-0002', commissionCode: 'COMM-2026-0001', sampleCode: 'SMP-0002', testItems: 'pH、铅、镉', method: 'GB/T 5750', plannedDate: '2026-07-26', executor: '王磊', reviewer: '陈琳', progress: '待开工', resourceValid: '待校验', exceptionFlag: '', status: '待开工', createdAt: '2026-07-24 10:00' },
    ],

    records: [
      { id: 'r1', code: 'REC-2026-0001', taskCode: 'TASK-2026-0001', version: 'V1', data: 'pH=7.2; 铅<0.005mg/L; 镉<0.001mg/L; 总大肠菌群=未检出', calculatedResult: '全部符合GB 5749限值', recordedBy: '王磊', reviewedBy: '', correctionReason: '', status: '待复核', createdAt: '2026-07-25 16:00' },
    ],

    reports: [
      { id: 'rp1', code: 'RPT-2026-0001', commissionCode: 'COMM-2026-0001', customerName: '清源环境科技有限公司', type: '检测报告', author: '王磊', reviewer: '陈琳', signer: '', version: 'V1', deliveryDeadline: '2026-08-05', accreditationScope: '认可', deliveryChannel: '邮件', status: '待审核', createdAt: '2026-07-26 09:00' },
    ],

    auditLog: [
      { time: '2026-07-28 16:30', actor: '陈琳', action: '提交复核', detail: 'REC-2026-0001 记录版本 V1 已提交待复核' },
      { time: '2026-07-26 09:00', actor: '王磊', action: '编制报告', detail: 'RPT-2026-0001 检测报告 V1 草稿已创建' },
      { time: '2026-07-25 16:00', actor: '王磊', action: '提交原始记录', detail: 'TASK-2026-0001 记录 REC-2026-0001 V1' },
      { time: '2026-07-22 10:00', actor: '李敏', action: '接收样品', detail: 'SMP-0001 饮用水-自来水 已接收' },
      { time: '2026-07-20 09:15', actor: '张晨', action: '创建委托', detail: 'COMM-2026-0001 清源环境科技有限公司 检测委托' },
    ],
  };
}
