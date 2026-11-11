const DSH_URL = (process.env.DSH_URL || 'http://127.0.0.1:62498').replace(/\/+$/, '')
const CONFIG_PATH = '/dsh-reply-language/config'
const TIMEOUT_MS = 5000

const results = []

async function request(method, body) {
  const res = await fetch(DSH_URL + CONFIG_PATH, {
    method,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: body === undefined ? { accept: 'application/json' } : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch (err) {
    data = null
  }
  return { status: res.status, data }
}

function fail(message) {
  results.push({ ok: false, message })
}

async function run(name, fn) {
  try {
    await fn()
    results.push({ ok: true, name })
  } catch (err) {
    fail(name + ': ' + ((err && err.message) || String(err)))
  }
}

const initial = await request('GET')
const originalLanguage = initial.data && initial.data.ok ? initial.data.config.language : 'auto'

try {
  await run('GET config returns ok', async () => {
    const r = await request('GET')
    if (r.status !== 200 || !r.data || !r.data.ok || !r.data.config) throw new Error('status ' + r.status)
  })

  await run('POST sets language and persists it', async () => {
    const r = await request('POST', { language: 'ru' })
    if (r.status !== 200 || !r.data.ok || r.data.config.language !== 'ru') throw new Error('unexpected response')
    const again = await request('GET')
    if (!again.data.ok || again.data.config.language !== 'ru') throw new Error('change not persisted')
  })

  await run('POST rejects an unknown language', async () => {
    const r = await request('POST', { language: 'klingon' })
    if (r.status !== 400) throw new Error('expected 400, got ' + r.status)
  })

  await run('POST rejects a malformed body', async () => {
    const res = await fetch(DSH_URL + CONFIG_PATH, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'content-type': 'application/json' },
      body: '{nope',
    })
    if (res.status !== 400) throw new Error('expected 400, got ' + res.status)
  })
} finally {
  await request('POST', { language: originalLanguage })
}

let failed = 0
for (const result of results) {
  if (result.ok) console.log('PASS ' + result.name)
  else {
    failed += 1
    console.log('FAIL ' + result.message)
  }
}
console.log('smoke done: ' + (results.length - failed) + '/' + results.length + ' passed against ' + DSH_URL)
if (failed > 0) process.exit(1)
