<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <section class="panel empty-message">
    <h1>{{ route.name === 'workspace.forbidden' ? t('无权访问此页面') : t('此页面尚未接入') }}</h1>
    <p class="muted">{{ route.name === 'workspace.forbidden' ? t('请联系管理员为当前账号分配页面权限。') : t('请从工作台打开本次已接入的页面。') }}</p>
    <RouterLink to="/entry" class="return-link">{{ t('返回工作台') }}</RouterLink>
  </section>
</template>
