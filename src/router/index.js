import { createRouter, createWebHashHistory } from 'vue-router'
import { useSession } from '../stores/session.js'
import { registerRouterGuards } from './guards.js'
import { businessRoutes } from './pages.js'
import authRoutes from './routes/auth/login/index.js'
import { workspaceHome, workspaceStatus } from './routes/workspace/index.js'

export function createAppRouter(pinia) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      ...authRoutes,
      {
        path: '/',
        component: () => import('../layouts/WorkspaceLayout.vue'),
        children: [...workspaceHome, ...businessRoutes, ...workspaceStatus],
      },
    ],
  })
  registerRouterGuards(router, useSession(pinia))
  return router
}
