const statusView = () => import('../../../views/workspace/StatusView.vue')

export const workspaceHome = [
  { path: '', redirect: '/entry' },
  { path: 'entry', name: 'workspace.home', component: () => import('../../../views/workspace/EntryView.vue') },
]

export const workspaceStatus = [
  { path: 'error/403', name: 'workspace.forbidden', component: statusView },
  { path: ':pathMatch(.*)*', name: 'workspace.unavailable', component: statusView },
]
