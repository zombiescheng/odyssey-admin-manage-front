import assert from 'node:assert/strict'
import test from 'node:test'
import {
  accessDecision, allowedPages, safeReturnPath,
} from '../src/router/permissions.js'
import { closeTab, restoreTabs, upsertTab } from '../src/stores/tab-history.js'
import { legacyPassword } from '../src/api/auth/login/protocol.js'
import { pages } from '../src/router/pages.js'

const [log, product] = pages

test('grants migrated routes by resource code and keeps unknown and button resources out of the menu', () => {
  const resources = [
    { code: 'system', children: [{ code: 'Log' }, { code: 'Unknown' }] },
    { code: 'manageProduct', type: 1 },
    { code: 'other', webUrl: product.path },
  ]
  assert.deepEqual(allowedPages([log, product], resources), [log])
  assert.equal(log.name, 'system.logs.list')
  assert.equal(log.permissionCode, 'Log')
})

test('blocks protected routes until both login and the matching grant are available', () => {
  assert.equal(accessDecision(null, 'Log'), 'login')
  assert.equal(accessDecision(new Set([product.name]), log.name), 'forbidden')
  assert.equal(accessDecision(new Set([log.name]), log.name), 'allow')
})

test('rejects external and non-migrated login redirects while keeping old route prefix and query', () => {
  const paths = new Set([log.path, '/V8' + log.path])
  assert.equal(safeReturnPath('//other.example' + log.path, paths), '/entry')
  assert.equal(safeReturnPath('/not-migrated', paths), '/entry')
  assert.equal(safeReturnPath('/V8' + log.path + '?page=2', paths), '/V8' + log.path + '?page=2')
})

test('uses one tab per route name and chooses a neighboring tab when closing the current route', () => {
  const initial = [{ name: log.name, path: log.path }]
  const tabs = upsertTab(upsertTab(initial, product), { ...log, path: log.path + '?page=2' })
  assert.equal(tabs.length, 2)
  assert.equal(tabs[0].path, log.path + '?page=2')
  assert.deepEqual(closeTab(tabs, log.name, log.name), {
    tabs: [{ name: product.name, path: product.path }], nextPath: product.path,
  })
  assert.equal(closeTab(initial, log.name, log.name).nextPath, '/entry')
})

test('restores legacy tabs by permission code and URL while discarding mismatched or unauthorized entries', () => {
  const legacyPath = '/V8' + log.path + '?page=2'
  assert.deepEqual(restoreTabs([
    { name: 'Log', path: legacyPath },
    { name: 'manageProduct', path: product.path },
    { name: log.name, path: product.path },
  ], [log]), [{ name: log.name, path: legacyPath }])
})

test('matches legacy AES-CBC zero padding with a synthetic key and multi-byte input', async () => {
  const { createCipheriv } = await import('node:crypto')
  const key = '1234567890123456'
  const iv = '1234567890123456'
  for (const value of ['迁移试点', '1234567890123456', 'more than one block']) {
    const input = Buffer.from(value)
    const bytes = Buffer.alloc(Math.ceil(input.length / 16) * 16)
    input.copy(bytes)
    const cipher = createCipheriv('aes-128-cbc', key, iv)
    cipher.setAutoPadding(false)
    const expected = Buffer.concat([cipher.update(bytes), cipher.final()]).toString('base64')
    assert.equal(await legacyPassword(value, key, iv), expected)
  }
})
