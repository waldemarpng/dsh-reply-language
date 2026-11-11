import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { readConfig, writeConfig, ConfigError } from '../lib/config.js'

function withTempHome(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-reply-language-test-'))
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = dir
  try {
    return fn(dir)
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test('missing config file yields defaults', () => {
  withTempHome(() => {
    assert.deepEqual(readConfig(), { language: 'auto', enabled: true })
  })
})

test('config round trip preserves values', () => {
  withTempHome(() => {
    const written = writeConfig({ language: 'ru' })
    assert.deepEqual(written, { language: 'ru', enabled: true })
    assert.deepEqual(readConfig(), { language: 'ru', enabled: true })
    const updated = writeConfig({ language: 'auto', enabled: false })
    assert.deepEqual(updated, { language: 'auto', enabled: false })
    assert.deepEqual(readConfig(), { language: 'auto', enabled: false })
  })
})

test('config file is written with restrictive permissions', () => {
  withTempHome((dir) => {
    writeConfig({ language: 'de' })
    const st = fs.statSync(path.join(dir, '.dsh-reply-language.json'))
    assert.equal(st.mode & 0o077, 0)
  })
})

test('unknown top level key is rejected', () => {
  withTempHome((dir) => {
    fs.writeFileSync(path.join(dir, '.dsh-reply-language.json'), '{"language":"ru","extra":1}')
    assert.throws(() => readConfig(), ConfigError)
  })
})

test('unsupported language id is rejected on read', () => {
  withTempHome((dir) => {
    fs.writeFileSync(path.join(dir, '.dsh-reply-language.json'), '{"language":"klingon"}')
    assert.throws(() => readConfig(), /supported language id/)
  })
})

test('unsupported language id is rejected on write', () => {
  withTempHome(() => {
    assert.throws(() => writeConfig({ language: 'klingon' }), ConfigError)
    assert.deepEqual(readConfig(), { language: 'auto', enabled: true })
  })
})

test('invalid enabled value is rejected', () => {
  withTempHome(() => {
    assert.throws(() => writeConfig({ enabled: 'yes' }), ConfigError)
  })
})

test('broken json is a config error', () => {
  withTempHome((dir) => {
    fs.writeFileSync(path.join(dir, '.dsh-reply-language.json'), '{nope')
    assert.throws(() => readConfig(), ConfigError)
  })
})

test('update keys are validated', () => {
  withTempHome(() => {
    assert.throws(() => writeConfig({ unknown: true }), ConfigError)
    assert.throws(() => writeConfig(null), ConfigError)
    assert.throws(() => writeConfig(['ru']), ConfigError)
  })
})
