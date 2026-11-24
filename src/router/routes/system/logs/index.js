export default [{
  name: 'system.logs.list',
  path: '/system-manage/log-list',
  alias: '/V8/system-manage/log-list',
  component: () => import('../../../../views/system/logs/LogListView.vue'),
  meta: { permissionCode: 'Log', title: '操作日志', section: 'system', sectionTitle: t => t('系统管理'), cacheName: 'LogListView' },
}]
