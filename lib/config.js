import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { isLanguageId, AUTO_ID } from './languages.js'

const TOP_LEVEL_KEYS = new Set(['language', 'enabled'])

const DEFAULT_CONFIG = {
  language: AUTO_ID,
  enabled: true,
}

export class ConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigError'
  }
}

function configDir() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
}

function configFile() {
  return path.join(configDir(), '.dsh-reply-language.json')
}

function readRaw() {
  try {
    return JSON.parse(fs.readFileSync(configFile(), 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new ConfigError('config file is not valid JSON: ' + (err && err.message))
  }
}

export function readConfig() {
  const raw = readRaw()
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ConfigError('config: top-level object required')
  }
  for (const key of Object.keys(raw)) {
    if (!TOP_LEVEL_KEYS.has(key)) throw new ConfigError(`config top level: unknown key "${key}"`)
  }
  const config = {
    language: DEFAULT_CONFIG.language,
    enabled: DEFAULT_CONFIG.enabled,
  }
  if (raw.language !== undefined) {
    if (!isLanguageId(raw.language)) {
      throw new ConfigError(`config "language": expected "auto" or a supported language id, got "${raw.language}"`)
    }
    config.language = raw.language
  }
  if (raw.enabled !== undefined) {
    if (typeof raw.enabled !== 'boolean') throw new ConfigError('config "enabled": boolean required')
    config.enabled = raw.enabled
  }
  return config
}

export function writeConfig(update) {
  if (update === null || typeof update !== 'object' || Array.isArray(update)) {
    throw new ConfigError('config update: object required')
  }
  for (const key of Object.keys(update)) {
    if (!TOP_LEVEL_KEYS.has(key)) throw new ConfigError(`config update: unknown key "${key}"`)
  }
  const next = readConfig()
  if (update.language !== undefined) {
    if (!isLanguageId(update.language)) {
      throw new ConfigError(`config update "language": expected "auto" or a supported language id, got "${update.language}"`)
    }
    next.language = update.language
  }
  if (update.enabled !== undefined) {
    if (typeof update.enabled !== 'boolean') throw new ConfigError('config update "enabled": boolean required')
    next.enabled = update.enabled
  }
  const dir = configDir()
  fs.mkdirSync(dir, { recursive: true })
  const target = configFile()
  const tmp = target + '.' + process.pid + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify({ language: next.language, enabled: next.enabled }, null, 2) + '\n', {
    mode: 0o600,
  })
  fs.renameSync(tmp, target)
  return next
}

export function defaultConfig() {
  return { ...DEFAULT_CONFIG }
}
