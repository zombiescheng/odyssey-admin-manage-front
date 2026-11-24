import { knownPaths } from './pages.js'
import { accessDecision, safeReturnPath } from './permissions.js'

export function registerRouterGuards(router, session) {
  router.beforeEach(async to => {
    await session.restore()
    if (to.name === 'auth.login' || to.name === 'auth.login.challenge') {
      if (session.current) return safeReturnPath(to.query.redirect, knownPaths)
      if (to.name === 'auth.login.challenge' && !session.challenge) {
        return { name: 'auth.login', query: to.query }
      }
      return true
    }

    const grant = to.meta.permissionCode ? to.name : undefined
    const access = accessDecision(session.current?.grants ?? null, grant)
    if (access === 'login') {
      return { name: 'auth.login', query: { redirect: safeReturnPath(to.fullPath, knownPaths) } }
    }
    if (access === 'forbidden') return { name: 'workspace.forbidden', replace: true }
    return true
  })

  router.afterEach((to, _from, failure) => {
    if (failure) return
    if (to.meta.permissionCode) session.visit({ name: to.name, path: to.fullPath })
  })
}
