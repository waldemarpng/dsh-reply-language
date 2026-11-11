import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createConfigHandler, requestRejection, publicConfig } from '../lib/routes.js'

function stubRequest(headers, method, body) {
  const chunks = body === undefined ? [] : [Buffer.from(body)]
  return {
    method: method || 'GET',
    headers,
    on(event, listener) {
      if (event === 'data' && chunks.length > 0) listener(chunks.shift())
      if (event === 'end') listener()
    },
    destroy() {},
  }
}

function stubResponse() {
  const res = {
    statusCode: 0,
    headers: null,
    body: '',
    destroyed: false,
    writeHead(code, headers) {
      this.statusCode = code
      this.headers = headers
    },
    end(body) {
      if (body !== undefined) this.body = body
      this.finished = true
    },
  }
  return res
}

const SAME_ORIGIN = { host: '127.0.0.1:62498', origin: 'http://127.0.0.1:62498', 'sec-fetch-site': 'same-origin' }

function handlerWith(config) {
  return createConfigHandler({
    readConfig: () => config,
    writeConfig: (update) => Object.assign({}, config, update),
  })
}

test('get returns the public config', async () => {
  const handler = handlerWith({ language: 'ru', enabled: true })
  const res = stubResponse()
  await handler.get(stubRequest(SAME_ORIGIN), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(JSON.parse(res.body), { ok: true, config: { language: 'ru', enabled: true } })
})

test('get maps config errors to 400', async () => {
  const handler = createConfigHandler({
    readConfig: () => {
      const err = new Error('config "language": bad')
      err.name = 'ConfigError'
      throw err
    },
    writeConfig: () => {
      throw new Error('unreachable')
    },
  })
  const res = stubResponse()
  await handler.get(stubRequest(SAME_ORIGIN), res)
  assert.equal(res.statusCode, 400)
  assert.equal(JSON.parse(res.body).ok, false)
})

test('post rejects non-json bodies', async () => {
  const handler = handlerWith({ language: 'auto', enabled: true })
  const res = stubResponse()
  await handler.post(stubRequest(SAME_ORIGIN, 'POST', '{nope'), res)
  assert.equal(res.statusCode, 400)
})

test('post rejects non-object bodies', async () => {
  const handler = handlerWith({ language: 'auto', enabled: true })
  const res = stubResponse()
  await handler.post(stubRequest(SAME_ORIGIN, 'POST', '["ru"]'), res)
  assert.equal(res.statusCode, 400)
})

test('post rejects non-post methods', async () => {
  const handler = handlerWith({ language: 'auto', enabled: true })
  const res = stubResponse()
  await handler.post(stubRequest(SAME_ORIGIN, 'PUT', '{}'), res)
  assert.equal(res.statusCode, 405)
})

test('post maps write errors to 400', async () => {
  const handler = createConfigHandler({
    readConfig: () => ({ language: 'auto', enabled: true }),
    writeConfig: () => {
      const err = new Error('config update "language": expected a supported id')
      err.name = 'ConfigError'
      throw err
    },
  })
  const res = stubResponse()
  await handler.post(stubRequest(SAME_ORIGIN, 'POST', '{"language":"klingon"}'), res)
  assert.equal(res.statusCode, 400)
  assert.equal(JSON.parse(res.body).ok, false)
})

test('post writes valid language', async () => {
  const handler = handlerWith({ language: 'auto', enabled: true })
  const res = stubResponse()
  await handler.post(stubRequest(SAME_ORIGIN, 'POST', '{"language":"ja"}'), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(JSON.parse(res.body), { ok: true, config: { language: 'ja', enabled: true } })
})

test('fence rejects cross-site requests', () => {
  const code = requestRejection({ headers: { host: 'a', 'sec-fetch-site': 'cross-site' } }, false)
  assert.equal(code, 403)
})

test('fence rejects mismatched origins', () => {
  const code = requestRejection({ headers: { host: '127.0.0.1:62498', origin: 'http://evil.example' } }, false)
  assert.equal(code, 403)
})

test('fence rejects null origins', () => {
  assert.equal(requestRejection({ headers: { host: 'a', origin: 'null' } }, false), 403)
  assert.equal(requestRejection({ headers: { host: 'a', origin: '' } }, false), 403)
})

test('fence rejects sandboxed posts without browser metadata on remote hosts', () => {
  const code = requestRejection({ headers: { host: 'example.com' } }, true)
  assert.equal(code, 403)
})

test('fence allows loopback requests without browser metadata', () => {
  assert.equal(requestRejection({ headers: { host: '127.0.0.1:62498' } }, true), 0)
})

test('fence rejects missing host', () => {
  assert.equal(requestRejection({ headers: {} }, false), 403)
})

test('fence allows same-origin browser requests', () => {
  assert.equal(requestRejection({ headers: SAME_ORIGIN }, true), 0)
})

test('publicConfig exposes only language and enabled', () => {
  assert.deepEqual(publicConfig({ language: 'ru', enabled: false, secret: 'x' }), { language: 'ru', enabled: false })
})
