<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useVoerkaI18n } from '@voerkai18n/vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import pt from 'element-plus/es/locale/lang/pt'
import 'dayjs/locale/zh-cn.js'
import 'dayjs/locale/pt.js'
import { i18nScope } from './languages/index.js'

const route = useRoute()
const { activeLanguage, t } = useVoerkaI18n(i18nScope)
const elementLocales = { 'zh-CN': zhCn, 'en-US': en, 'pt-PT': pt }
const elementLocale = computed(() => elementLocales[activeLanguage.value] || zhCn)

watchEffect(() => {
  document.documentElement.lang = activeLanguage.value
  document.title = route.meta.title ? t(route.meta.title) + ' · Odyssey' : 'Odyssey ' + t('管理后台')
})
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="Component" />
      <p v-else class="app-loading" role="status">{{ t('正在加载管理后台…') }}</p>
    </RouterView>
  </ElConfigProvider>
</template>
