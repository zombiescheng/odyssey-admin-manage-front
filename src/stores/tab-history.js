import { safeReturnPath } from '../router/permissions.js'

export function upsertTab(tabs, { name, path }) {
  const tab = { name, path }
  return tabs.some(item => item.name === name)
    ? tabs.map(item => item.name === name ? tab : item)
    : [...tabs, tab]
}

export function closeTab(tabs, name, activeName) {
  const index = tabs.findIndex(tab => tab.name === name)
  const remaining = tabs.filter(tab => tab.name !== name)
  return {
    tabs: remaining,
    nextPath: activeName === name
      ? remaining[index]?.path ?? remaining[index - 1]?.path ?? '/entry'
      : null,
  }
}

export function restoreTabs(saved, grantedPages) {
  if (!Array.isArray(saved)) return []
  const known = new Set(grantedPages.flatMap(page => [page.path, ...page.aliases]))
  let restored = []
  for (const tab of saved) {
    if (safeReturnPath(tab?.path, known) === '/entry') continue
    const path = tab.path.split(/[?#]/, 1)[0]
    const page = grantedPages.find(candidate =>
      (candidate.name === tab.name || candidate.permissionCode === tab.name) &&
      (candidate.path === path || candidate.aliases.includes(path)),
    )
    if (page) restored = upsertTab(restored, { name: page.name, path: tab.path })
  }
  return restored
}
