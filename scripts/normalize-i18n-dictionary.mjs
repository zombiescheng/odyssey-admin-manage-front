import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../src/languages/translates/messages/default.json', import.meta.url)
const original = readFileSync(file, 'utf8')
const dictionary = JSON.parse(original)

const entries = Object.keys(dictionary).sort().map(text => {
  const { $files, ...entry } = dictionary[text]
  return [text, entry]
})
const normalized = `${JSON.stringify(Object.fromEntries(entries), null, 4)}\n`

if (normalized !== original) {
  writeFileSync(file, normalized)
}
