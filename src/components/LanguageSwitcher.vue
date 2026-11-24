<script setup>
import { ref } from 'vue'
import { useVoerkaI18n } from '@voerkai18n/vue'
import { i18nScope } from '../languages/index.js'

const { activeLanguage, languages } = useVoerkaI18n(i18nScope)
const switching = ref(false)
const failed = ref(false)

async function changeLanguage(event) {
  const select = event.target
  switching.value = true
  failed.value = false
  try {
    await i18nScope.change(select.value)
  } catch {
    failed.value = true
  } finally {
    select.value = i18nScope.activeLanguage
    switching.value = false
  }
}
</script>

<template>
  <div class="language-switcher">
    <select :aria-label="t('语言')" :value="activeLanguage" :disabled="switching" @change="changeLanguage">
      <option v-for="language in languages" :key="language.name" :value="language.name">
        {{ language.nativeTitle || language.title }}
      </option>
    </select>
    <p v-if="failed" role="alert">{{ t('切换语言失败，请重试。') }}</p>
  </div>
</template>

<style scoped>
.language-switcher select {
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--ink);
  background: white;
  font: inherit;
}
.language-switcher p {
  margin-top: 4px;
  color: #8e2f29;
  white-space: normal;
}
</style>
