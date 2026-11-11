import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import plugin from '../lib/index.js'
import { CONFIG_PATH } from '../lib/routes.js'

test('host wiring registers the config route and disposes it with its scope', () => {
  const handlers = {}
  let injectDeps = null
  let injectCallback = null
  const root = {
    on: (name, handler) => {
      handlers[name] = handler
    },
    inject: (deps, callback) => {
      injectDeps = deps
      injectCallback = callback
    },
  }

  plugin.apply(root)

  assert.equal(typeof handlers['agent/pre-step'], 'function')
  assert.deepEqual(injectDeps, ['webServer'])
  assert.equal(typeof injectCallback, 'function')

  let registeredPath = null
  let routeDisposed = false
  let effectCleanup = null
  const ctx = {
    webServer: {
      register: (spec) => {
        registeredPath = spec.path
        return () => {
          routeDisposed = true
        }
      },
    },
    effect: (fn) => {
      effectCleanup = fn()
    },
  }

  injectCallback(ctx)

  assert.equal(registeredPath, CONFIG_PATH)
  assert.equal(typeof effectCleanup, 'function')
  assert.equal(routeDisposed, false)
  effectCleanup()
  assert.equal(routeDisposed, true)
})

test('agent/pre-step handler survives a broken config', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-reply-language-host-'))
  fs.writeFileSync(path.join(dir, '.dsh-reply-language.json'), '{broken')
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = dir
  try {
    const handlers = {}
    let injectCallback = null
    const root = {
      on: (name, handler) => {
        handlers[name] = handler
      },
      inject: (deps, callback) => {
        injectCallback = callback
      },
    }

    plugin.apply(root)

    const decision = { kind: 'claim', messages: [] }
    const result = await handlers['agent/pre-step']({ agent: { session: {} } }, async () => decision)
    assert.equal(result, decision)
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
