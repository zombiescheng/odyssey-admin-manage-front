import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18nPlugin } from '@voerkai18n/vue'
import {
  ElButton, ElDatePicker, ElDescriptions, ElDescriptionsItem, ElDialog, ElInput,
  ElOption, ElPagination, ElSelect, ElTable, ElTableColumn, ElTag, ElLoading,
} from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/index.css'
import App from './App.vue'
import { i18nScope } from './languages/index.js'
import { createAppRouter } from './router/index.js'

i18nScope.ready(() => {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(i18nPlugin, { i18nScope }).use(pinia).use(createAppRouter(pinia)).use(ElLoading)
  for (const component of [
    ElButton, ElDatePicker, ElDescriptions, ElDescriptionsItem, ElDialog, ElInput,
    ElOption, ElPagination, ElSelect, ElTable, ElTableColumn, ElTag,
  ]) {
    app.component(component.name, component)
  }
  app.mount('#app')
})
