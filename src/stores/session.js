import { t } from '../languages/index.js'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { login, loadWorkspace, logout } from '../api/auth/login/index.js'
import { verifyTotp } from '../api/auth/login/totp.js'
import { SessionExpired } from '../api/clients/index.js'
import { isDemo } from '../api/demo/index.js'
import { pages } from '../router/pages.js'
import { allowedPages } from '../router/permissions.js'
import { closeTab, restoreTabs, upsertTab } from './tab-history.js'
const scope = 'odyssey-vue3:' + (isDemo ? 'demo:' : 'api:')

function read(key) {
  try {
    return JSON.parse(sessionStorage.getItem(scope + key) || 'null')
  } catch {
    return null
  }
}
function persist(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(scope + key)
    else sessionStorage.setItem(scope + key, JSON.stringify(value))
  } catch {
    // Allow the current session to work even when storage is unavailable.
  }
}
function isCredential(value) {
  return Boolean(value &&
    typeof value.accessToken === 'string' && value.accessToken &&
    typeof value.tokenType === 'string' && value.tokenType &&
    typeof value.userId === 'string' && value.userId)
}

export const useSession = defineStore('session', () => {
  const current = shallowRef(null)
  const challenge = shallowRef(null)
  const tabs = ref([])
  const notice = ref('')
  const allowed = computed(() => pages.filter(page => current.value?.grants.has(page.name)))
  let generation = 0
  let restoration

  async function establish(credential, restoreSavedTabs = false) {
    const attempt = ++generation
    const workspace = await loadWorkspace(credential)
    if (attempt !== generation) return
    const grantedPages = allowedPages(pages, workspace.resources)
    const grants = new Set(grantedPages.map(page => page.name))
    current.value = { credential, userName: workspace.userName, grants }
    challenge.value = null
    tabs.value = restoreSavedTabs ? restoreTabs(read('tabs'), grantedPages) : []
    persist('credential', credential)
    persist('tabs', tabs.value)
  }

  function clear() {
    generation++
    challenge.value = null
    current.value = null
    tabs.value = []
    persist('credential', null)
    persist('tabs', null)
  }

  function restore() {
    if (!restoration) {
      const saved = read('credential')
      restoration = isCredential(saved) ? establish(saved, true).catch(error => {
        clear()
        notice.value = error instanceof SessionExpired
          ? error.message
          : t('暂时无法恢复会话，请重新登录。')
      }) : Promise.resolve()
    }
    return restoration
  }

  async function signIn(username, password) {
    notice.value = ''
    const result = await login(username, password)
    if (result.kind === 'authenticated') await establish(result.credential)
    else challenge.value = result
  }

  async function verify(code, recovery) {
    if (challenge.value?.kind !== 'verify') throw new Error(t('请重新登录后验证。'))
    await establish(await verifyTotp(challenge.value, code, recovery))
  }

  async function signOut() {
    const credential = current.value?.credential
    clear()
    if (!credential) return
    try {
      await logout(credential)
    } catch (error) {
      if (!(error instanceof SessionExpired)) notice.value = t('已退出本地会话，服务器退出请求未完成。')
    }
  }

  function expire() {
    clear()
    notice.value = t('会话已过期，请重新登录。')
  }

  function visit(tab) {
    if (!current.value?.grants.has(tab.name)) return
    tabs.value = upsertTab(tabs.value, tab)
    persist('tabs', tabs.value)
  }

  function removeTab(name, activeName) {
    const result = closeTab(tabs.value, name, activeName)
    tabs.value = result.tabs
    persist('tabs', tabs.value)
    return result.nextPath
  }

  return { current, challenge, notice, allowed, tabs, restore, signIn, verify, signOut, expire, visit, removeTab }
})
