<script setup>
import { useSession } from '../../stores/session.js'
const session = useSession()
</script>

<template>
  <section>
    <div class="page-heading"><h1>{{ t('工作台') }}</h1></div>
    <div v-if="session.allowed.length" class="entry-pages">
      <RouterLink v-for="page in session.allowed" :key="page.name" :to="page.path" class="entry-card">
        <span>{{ page.sectionTitle(t) }}</span>
        <strong>{{ t(page.title) }}</strong>
        <span aria-hidden="true" class="entry-arrow">↗</span>
      </RouterLink>
    </div>
    <p v-else class="panel empty-message">{{ t('当前账号没有可访问的迁移页面。') }}</p>
  </section>
</template>
