const ROUTE_PREFIX = '/dsh-reply-language'
const CONFIG_PATH = ROUTE_PREFIX + '/config'
const BODY_LIMIT = 16 * 1024

function isLoopbackHostname(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[/, '').replace(/\]$/, '')
  if (!h) return false
  if (h === 'localhost' || h.endsWith('.localhost')) return true
  if (h === '::1') return true
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h)
  if (!m || Number(m[1]) !== 127) return false
  return [m[2], m[3], m[4]].every((x) => Number(x) <= 255)
}

function requestRejection(req, strict) {
  const headers = (req && req.headers) || {}
  if (String(headers['sec-fetch-site'] || '').toLowerCase() === 'cross-site') return 403
  let hostUrl = null
  try {
    hostUrl = new URL('http://' + String(headers.host || ''))
  } catch (err) {
    return 403
  }
  const authority = hostUrl.host.toLowerCase()
  const origin = headers.origin
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    let originUrl = null
    try {
      originUrl = new URL(origin)
    } catch (err) {
      return 403
    }
    if (originUrl.host.toLowerCase() !== authority) return 403
  } else if (origin === 'null' || origin === '') {
    return 403
  }
  if (strict && !headers['sec-fetch-site'] && !isLoopbackHostname(hostUrl.hostname)) return 403
  return 0
}

function sendJson(res, code, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function isConfigError(err) {
  return err instanceof Error && err.name === 'ConfigError'
}

function publicConfig(config) {
  return { language: config.language, enabled: config.enabled }
}

function createConfigHandler({ readConfig, writeConfig }) {
  return {
    get: (req, res) => {
      try {
        sendJson(res, 200, { ok: true, config: publicConfig(readConfig()) })
      } catch (err) {
        if (isConfigError(err)) {
          sendJson(res, 400, { ok: false, error: err.message })
          return
        }
        sendJson(res, 500, { ok: false, error: 'config read failed' })
      }
    },
    post: async (req, res) => {
      if (String(req.method || 'GET').toUpperCase() !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'POST only' })
        return
      }
      let payload = null
      try {
        payload = JSON.parse(await readBody(req, BODY_LIMIT))
      } catch (err) {
        sendJson(res, 400, { ok: false, error: 'body is not valid JSON' })
        return
      }
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        sendJson(res, 400, { ok: false, error: 'body must be a JSON object' })
        return
      }
      try {
        sendJson(res, 200, { ok: true, config: publicConfig(writeConfig(payload)) })
      } catch (err) {
        if (isConfigError(err)) {
          sendJson(res, 400, { ok: false, error: err.message })
          return
        }
        sendJson(res, 500, { ok: false, error: 'config write failed' })
      }
    },
  }
}

export { ROUTE_PREFIX, CONFIG_PATH, BODY_LIMIT, createConfigHandler, requestRejection, publicConfig }
