import settings from './settings.json' with { type: 'json' }

export default {
  get(key) {
    try {
      const language = globalThis.localStorage?.getItem(key)
      return settings.languages.some(item => item.name === language) ? language : undefined
    } catch {
      return undefined
    }
  },
  set(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      // Language switching can still work when browser storage is unavailable.
    }
  },
  remove(key) {
    try {
      globalThis.localStorage?.removeItem(key)
    } catch {
      // Browser storage is optional.
    }
  },
}
