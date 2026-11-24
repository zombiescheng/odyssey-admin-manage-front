import { VoerkaI18nScope } from '@voerkai18n/runtime'
import settings from './settings.json' with { type: 'json' }
import idMap from './messages/idMap.json' with { type: 'json' }
import { component } from './component.js'
import messages from './loader.js'
import storage from './storage.js'

export const i18nScope = new VoerkaI18nScope({
  id: 'odyssey-manage-vue3',
  languages: settings.languages,
  messages,
  idMap,
  storage,
  storageKey: 'odyssey-vue3:locale',
  component,
})

export const t = i18nScope.t

export function getApiLanguage() {
  return i18nScope.activeLanguage.split('-')[0]
}
