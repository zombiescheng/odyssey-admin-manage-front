<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isDemo } from '../api/demo/index.js'
import { useSession } from '../stores/session.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const session = useSession()
const route = useRoute()
const router = useRouter()
const leaving = ref(false)
const menuOpen = ref(false)
const activeName = computed(() => typeof route.name === 'string' ? route.name : '')
const activePage = computed(() => session.allowed.find(page => page.name === activeName.value))
const sections = computed(() => [...new Map(session.allowed.map(page => [page.section, page.sectionTitle]))])
const cachedViews = computed(() => session.allowed
  .filter(page => session.tabs.some(tab => page.name === tab.name))
  .map(page => page.cacheName))

async function close(name) {
  const next = session.removeTab(name, activeName.value)
  if (next) await router.push(next)
}

async function logout() {
  if (leaving.value) return
  leaving.value = true
  const signingOut = session.signOut()
  await router.replace({ name: 'auth.login' })
  await signingOut
  leaving.value = false
}
</script>

<template>
  <div class="workspace">
    <aside class="sidebar" :class="{ open: menuOpen }" id="workspace-menu">
      <RouterLink class="brand sidebar-brand" to="/entry" @click="menuOpen = false">
        <span class="brand-symbol" aria-hidden="true">O</span><span>ODYSSEY</span>
      </RouterLink>
      <nav :aria-label="t('业务导航')">
        <RouterLink class="nav-link" to="/entry" @click="menuOpen = false">{{ t('工作台') }}</RouterLink>
        <section v-for="[section, sectionTitle] in sections" :key="section" class="nav-group">
          <h2>{{ sectionTitle(t) }}</h2>
          <RouterLink v-for="page in session.allowed.filter(item => item.section === section)"
            :key="page.name" :to="page.path" class="nav-link" :class="{ selected: activeName === page.name }"
            @click="menuOpen = false">{{ t(page.title) }}</RouterLink>
        </section>
      </nav>
    </aside>
    <div class="workspace-body">
      <header class="topbar">
        <div class="breadcrumbs">
          <button type="button" class="mobile-menu" :aria-expanded="menuOpen" aria-controls="workspace-menu"
            @click="menuOpen = !menuOpen">{{ t('菜单') }}</button>
          <span>{{ activePage ? activePage.sectionTitle(t) : t('管理后台') }}</span>
          <template v-if="activePage"><span aria-hidden="true">/</span><strong>{{ t(activePage.title) }}</strong></template>
        </div>
        <div class="account">
          <LanguageSwitcher />
          <span v-if="isDemo" class="demo-indicator">{{ t('本地演示') }}</span>
          <span>{{ isDemo && session.current ? (session.current.credential.userId === 'demo-admin' ? t('演示管理员') : t('演示审计员')) : session.current?.userName }}</span>
          <el-button text :disabled="leaving" @click="logout">{{ t('退出') }}</el-button>
        </div>
      </header>
      <nav v-if="session.tabs.length" class="tabs" :aria-label="t('已打开页面')">
        <div v-for="tab in session.tabs" :key="tab.name" class="page-tab" :class="{ selected: tab.name === activeName }">
          <RouterLink :to="tab.path">{{ t(session.allowed.find(page => page.name === tab.name)?.title || "") }}</RouterLink>
          <button type="button" :aria-label="t('关闭{title}', { title: t(session.allowed.find(page => page.name === tab.name)?.title || '') })"
            @click="close(tab.name)">×</button>
        </div>
      </nav>
      <main class="workspace-content">
        <RouterView v-slot="{ Component, route: pageRoute }">
          <KeepAlive :include="cachedViews">
            <component :is="Component" :key="pageRoute.name" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>
