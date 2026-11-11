import { readConfig, writeConfig } from './config.js'
import { applyInstruction } from './instruction.js'
import { CONFIG_PATH, createConfigHandler, requestRejection } from './routes.js'

let lastConfigError = ''

function warnConfigError(err) {
  const message = (err && err.message) || String(err)
  if (message === lastConfigError) return
  lastConfigError = message
  console.error('[dsh-reply-language] config unreadable, language pinning is off: ' + message)
}

function clearConfigError() {
  lastConfigError = ''
}

function currentConfig() {
  try {
    const config = readConfig()
    clearConfigError()
    return config
  } catch (err) {
    warnConfigError(err)
    return null
  }
}

export default {
  name: 'dsh-reply-language',
  apply(root) {
    root.on('agent/pre-step', async ({ agent }, next) => {
      const decision = await next()
      try {
        const config = currentConfig()
        if (config === null) return decision
        return applyInstruction(decision, agent, config)
      } catch (err) {
        console.error('[dsh-reply-language] pre-step failed: ' + ((err && err.message) || String(err)))
        return decision
      }
    })

    root.inject(['webServer'], (ctx) => {
      const handler = createConfigHandler({ readConfig, writeConfig })
      const guarded = (fn, strict) => (req, res) => {
        const code = requestRejection(req, strict)
        if (code) {
          try {
            res.statusCode = code
            res.end()
          } catch (err) {}
          return
        }
        return fn(req, res)
      }
      const dispatch = (req, res) => {
        const method = String(req.method || 'GET').toUpperCase()
        if (method === 'GET' || method === 'HEAD') return guarded(handler.get, false)(req, res)
        if (method === 'POST') return guarded(handler.post, true)(req, res)
        res.writeHead(405, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        })
        res.end(JSON.stringify({ ok: false, error: 'GET or POST only' }))
      }
      const disposeRoute = ctx.webServer.register({ kind: 'exact', path: CONFIG_PATH, handler: dispatch })
      ctx.effect(() => () => {
        try {
          disposeRoute()
        } catch (err) {}
      })
    })
  },
}
