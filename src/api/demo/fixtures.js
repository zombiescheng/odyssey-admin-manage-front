import { t } from '../../languages/index.js'
function credential(userId) {
  return { accessToken: 'local-demo-' + userId, tokenType: 'Demo', userId }
}
function page(items, { pageNum, pageSize }) {
  const start = (pageNum - 1) * pageSize
  return { records: items.slice(start, start + pageSize), total: items.length }
}

const today = Date.now()
const logs = [
  { id: 'L-01', startTime: today - 12 * 60_000, createBy: 'demo-admin', ip: '192.0.2.24',
    systemCode: 'manager', module: '菜单权限', method: '查询资源', status: 0,
    requestUri: '/api/ucs/userRole/getUserResources', httpRequestMethod: 'POST', processTime: 28,
    param: { userId: 'demo-admin' }, response: { code: 0 } },
  { id: 'L-02', startTime: today - 44 * 60_000, createBy: 'demo-auditor', ip: '192.0.2.46',
    systemCode: 'manager', module: '操作日志', method: '分页查询', status: 0,
    requestUri: '/api/ucs/systemLog/page', httpRequestMethod: 'POST', processTime: 81,
    param: { pageNum: 1, pageSize: 20 }, response: { code: 0 } },
  { id: 'L-03', startTime: today - 82 * 60_000, createBy: 'demo-admin', ip: '192.0.2.24',
    systemCode: 'manager', module: '菜单权限', method: '查询资源', status: 1,
    requestUri: '/api/ucs/userRole/getUserResources', httpRequestMethod: 'POST', processTime: 54,
    response: { code: 403, msg: '示例权限错误' } },
]
const products = [
  { gameCode: 'IT-021', gameName: 'Golden Orchard', unitPrice: 5, settled: 3200, issued: 1400, available: 1800, totalPrices: 16000, status: 0 },
  { gameCode: 'IT-024', gameName: 'City Lights', unitPrice: 10, settled: 2400, issued: 900, available: 1500, totalPrices: 24000, status: 0 },
  { gameCode: 'IT-029', gameName: 'Blue Horizon', unitPrice: 5, settled: 1800, issued: 600, available: 1200, totalPrices: 9000, status: 1 },
]

export const demoBackend = {
  async login(username) {
    if (username === 'demo-auditor') return { kind: 'verify', token: username, tokenType: 'Demo' }
    if (username === 'demo-admin') return { kind: 'authenticated', credential: credential(username) }
    throw new Error(t('请使用下方提供的本地演示账号。'))
  },
  async verify(challenge, code, recovery) {
    if (code !== (recovery ? 'DEMO-2026' : '123456')) throw new Error(t('演示验证码有误。'))
    return credential(challenge.token)
  },
  async enrollment() {
    throw new Error(t('演示账号已完成双因子设置。'))
  },
  async enableTotp() {
    throw new Error(t('演示账号已完成双因子设置。'))
  },
  async recoveryCodes() {
    throw new Error(t('演示账号已完成双因子设置。'))
  },
  async workspace({ userId }) {
    return {
      userName: userId === 'demo-admin' ? '演示管理员' : '演示审计员',
      resources: [
        { code: 'system', children: [{ code: 'Log', type: 0 }] },
        ...userId === 'demo-admin' ? [{ code: 'instant', children: [{ code: 'manageProduct', type: 0 }] }] : [],
      ],
    }
  },
  async logout() {},
  async logs(query) {
    const items = logs.filter(record => {
      const timestamp = Number(record.startTime)
      return (!query.createBy || record.createBy?.includes(query.createBy)) &&
        (!query.module || record.module?.includes(query.module)) &&
        (query.startTimeStart === undefined || timestamp >= query.startTimeStart) &&
        (query.startTimeEnd === undefined || timestamp <= query.startTimeEnd)
    })
    return page(items, query)
  },
  async products(query) {
    const items = products.filter(record =>
      (!query.gameCode || String(record.gameCode).toUpperCase().includes(query.gameCode.toUpperCase())) &&
      (query.status === null || query.status === record.status),
    )
    return page(items, query)
  },
}
