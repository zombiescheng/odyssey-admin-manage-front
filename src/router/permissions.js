export function allowedPages(pages, resources) {
  const codes = new Set()
  function visit(nodes) {
    for (const node of nodes) {
      if (node.code && String(node.type) !== '1') codes.add(node.code)
      if (Array.isArray(node.children)) visit(node.children)
    }
  }
  visit(resources)
  return pages.filter(page => codes.has(page.permissionCode))
}

export function accessDecision(grants, required) {
  if (!grants) return 'login'
  return required && !grants.has(required) ? 'forbidden' : 'allow'
}

export function safeReturnPath(value, allowed) {
  if (typeof value !== 'string' || !value.startsWith('/') || /[\\\u0000-\u0020]/.test(value)) {
    return '/entry'
  }
  const path = value.split(/[?#]/, 1)[0]
  return allowed.has(path) ? value : '/entry'
}
