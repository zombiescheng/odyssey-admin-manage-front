import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getApiLanguage, i18nScope, t } from '../src/languages/index.js'

test('translates the app shell and both business pages with the active language', async () => {
  await i18nScope.ready()

  for (const [language, apiLanguage, workspace, logs, products] of [
    ['zh-CN', 'zh', '工作台', '操作日志', '产品管理'],
    ['en-US', 'en', 'Workspace', 'Operation logs', 'Product management'],
    ['pt-PT', 'pt', 'Área de trabalho', 'Registos de operações', 'Gestão de produtos'],
  ]) {
    await i18nScope.change(language)
    assert.equal(getApiLanguage(), apiLanguage)
    assert.equal(t('工作台'), workspace)
    assert.equal(t('操作日志'), logs)
    assert.equal(t('产品管理'), products)
  }
  assert.equal(t('关闭{title}', { title: 'Inventário' }), 'Fechar Inventário')
})

test('keeps unique message IDs and named placeholders in the default VoerkaI18n dictionary', () => {
  const file = new URL('../src/languages/translates/messages/default.json', import.meta.url)
  const words = JSON.parse(readFileSync(file, 'utf8'))
  assert.ok(words['操作日志'])
  const ids = new Set()
  const placeholders = text => (text.match(/\{[a-zA-Z]\w*\}/g) || []).sort()

  for (const [source, { $id, $files, ...translations }] of Object.entries(words)) {
    assert.ok(Number.isInteger($id) && $id > 0, `Missing message ID for "${source}"`)
    assert.equal(ids.has($id), false, `Duplicate message ID ${$id} for "${source}"`)
    ids.add($id)
    for (const [language, translation] of Object.entries(translations)) {
      assert.deepEqual(placeholders(translation), placeholders(source), `${language} "${source}"`)
    }
  }
})
