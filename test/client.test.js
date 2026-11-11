import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_FILE = path.join(HERE, '..', 'lib', 'client.js')

function loadClientModule(dimensions) {
  const registrations = []
  const window = Object.assign(
    { __ModuleLoader__: { load: (registration) => registrations.push(registration) } },
    { innerWidth: 800, innerHeight: 800 },
    dimensions || {},
  )
  const source = fs.readFileSync(CLIENT_FILE, 'utf8')
  const factory = new Function('window', 'document', source + '\nreturn window.__ModuleLoader__')
  factory(window, undefined)
  assert.equal(registrations.length, 1)
  const registration = registrations[0]
  assert.equal(registration.id, 'dsh-reply-language')
  assert.equal(typeof registration.factory, 'function')

  const hooks = {
    states: [],
    cursor: 0,
    reset() {
      this.states = []
      this.cursor = 0
    },
    useState(initial) {
      const index = this.cursor++
      if (this.states[index] === undefined) this.states[index] = { value: initial }
      const slot = this.states[index]
      return [
        slot.value,
        (next) => {
          slot.value = typeof next === 'function' ? next(slot.value) : next
        },
      ]
    },
  }

  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => hooks.useState(initial),
    useEffect: () => {},
    useLayoutEffect: () => {},
    memo: (component) => component,
  }

  const ReactDOM = { createPortal: (element) => element }
  const exports = registration.factory((id) => {
    if (id === 'react') return React
    if (id === 'react-dom') return ReactDOM
    throw new Error('unexpected require: ' + id)
  })
  return { exports, React }
}

test('client module registers with the loader and exports the plugin face', () => {
  const { exports } = loadClientModule()
  assert.equal(typeof exports.apply, 'function')
  assert.deepEqual(exports.inject, ['slots'])
})

test('apply registers the pill next to the model selector', () => {
  const { exports } = loadClientModule()
  const registrations = []
  const injected = []
  const ctx = {
    slots: {
      inject: (parent, factory) => {
        injected.push(parent)
        registrations.push(factory())
        return () => {}
      },
      register: (options, component) => {
        registrations.push({ options, component })
        return () => {}
      },
    },
    effect: (fn) => {
      fn()
      return () => {}
    },
  }
  exports.apply(ctx)
  assert.ok(injected.includes('conversation.composer.bar'))
  const entry = registrations.find((row) => row.options && row.options.id === 'reply-language')
  assert.ok(entry, 'registered entry with id reply-language')
  assert.equal(entry.options.name, 'conversation.input.right')
  assert.equal(typeof entry.component, 'function')
})

test('apply survives a broken slots service', () => {
  const { exports } = loadClientModule()
  const ctx = {
    slots: {
      inject: () => {
        throw new Error('boom')
      },
    },
    effect: (fn) => {
      fn()
      return () => {}
    },
  }
  assert.doesNotThrow(() => exports.apply(ctx))
})

test('client module contains the config route and no page-script injection', () => {
  const source = fs.readFileSync(CLIENT_FILE, 'utf8')
  assert.ok(source.includes('/dsh-reply-language/config'))
  assert.ok(!source.includes('document.body.appendChild'))
})

test('menu stays open while the transcript scrolls', () => {
  const source = fs.readFileSync(CLIENT_FILE, 'utf8')
  assert.ok(!source.includes("addEventListener('scroll'"))
  assert.ok(source.includes("addEventListener('resize'"))
})

function menuStub(width, height) {
  return { offsetWidth: width, offsetHeight: height }
}

function rootStub(rect) {
  return { getBoundingClientRect: () => rect }
}

test('menu opens above a bottom composer and stays on screen', () => {
  const { exports } = loadClientModule({ innerWidth: 800, innerHeight: 800 })
  const placed = exports._placeMenu(rootStub({ top: 700, bottom: 728, left: 500 }), menuStub(240, 340))
  assert.equal(placed.top, 354)
  assert.ok(placed.top >= 8)
  assert.ok(placed.top + 340 <= 800 - 8)
})

test('menu opens below a centered hero composer and stays on screen', () => {
  const { exports } = loadClientModule({ innerWidth: 800, innerHeight: 800 })
  const placed = exports._placeMenu(rootStub({ top: 300, bottom: 328, left: 400 }), menuStub(240, 340))
  assert.equal(placed.top, 334)
  assert.ok(placed.top + 340 <= 800 - 8)
})

test('menu clamps to the right edge when the pill sits near it', () => {
  const { exports } = loadClientModule({ innerWidth: 320, innerHeight: 800 })
  const placed = exports._placeMenu(rootStub({ top: 700, bottom: 728, left: 200 }), menuStub(220, 204))
  assert.equal(placed.left, 320 - 8 - 220)
  assert.ok(placed.left >= 8)
  assert.ok(placed.left + 220 <= 320 - 8)
})

test('menu stays inside a short viewport', () => {
  const { exports } = loadClientModule({ innerWidth: 800, innerHeight: 300 })
  const placed = exports._placeMenu(rootStub({ top: 250, bottom: 278, left: 400 }), menuStub(240, 200))
  assert.ok(placed.top >= 8)
  assert.ok(placed.top + 200 <= 300 - 8)
})

test('menu caps its width to the viewport', () => {
  const { exports } = loadClientModule({ innerWidth: 320, innerHeight: 800 })
  const placed = exports._placeMenu(rootStub({ top: 700, bottom: 728, left: 100 }), menuStub(300, 204))
  assert.ok(placed.maxWidth <= 320 - 16)
  assert.ok(placed.left >= 8)
})
