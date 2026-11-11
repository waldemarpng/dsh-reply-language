import { randomUUID } from 'node:crypto'
import { languageById, AUTO_ID } from './languages.js'

const SOURCE_KIND = 'reply-language'

function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value
  for (const key of Object.keys(value)) deepFreeze(value[key])
  return Object.freeze(value)
}

function instructionText(english) {
  return (
    'Write every user-visible reply in ' +
    english +
    '. Prose, explanations, summaries, headings, and table content must follow this language. ' +
    'Keep code, identifiers, commands, file paths, quoted source text, and log or error strings in their original language. ' +
    'An explicit language request in a later user message overrides this rule for that message.'
  )
}

function buildInstructionMessage(language) {
  if (language === AUTO_ID) return undefined
  const entry = languageById(language)
  if (entry === null) return undefined
  return deepFreeze({
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text: instructionText(entry.english) }],
    source: { kind: SOURCE_KIND, language: entry.id },
  })
}

function isInstructionMessage(message) {
  return (
    message !== null &&
    typeof message === 'object' &&
    typeof message.source === 'object' &&
    message.source !== null &&
    message.source.kind === SOURCE_KIND
  )
}

function messageLanguage(message) {
  return isInstructionMessage(message) ? message.source.language : undefined
}

function sessionHasInstruction(agent, language) {
  const session = agent && agent.session
  const surface = session && session.surface
  if (!surface || !Array.isArray(surface.nodes) || typeof session.eventAt !== 'function') return false
  for (const seq of surface.nodes) {
    let event = null
    try {
      event = session.eventAt(seq)
    } catch (err) {
      event = null
    }
    if (!event || event.type !== 'user/message' || !event.data) continue
    if (messageLanguage(event.data) === language) return true
  }
  return false
}

function stripInstructions(messages) {
  return messages.filter((message) => !isInstructionMessage(message))
}

function applyInstruction(decision, agent, config) {
  if (!decision || !Array.isArray(decision.messages)) return decision
  if (decision.kind === 'reject') return decision
  const desired = config.enabled ? buildInstructionMessage(config.language) : undefined
  const claimed = decision.messages
  const mine = claimed.filter(isInstructionMessage)
  if (desired === undefined) {
    if (mine.length === 0) return decision
    return { ...decision, messages: stripInstructions(claimed) }
  }
  const language = config.language
  if (mine.some((message) => messageLanguage(message) === language)) return decision
  if (sessionHasInstruction(agent, language)) {
    if (mine.length === 0) return decision
    return { ...decision, messages: stripInstructions(claimed) }
  }
  return { ...decision, messages: [...stripInstructions(claimed), desired] }
}

export {
  SOURCE_KIND,
  applyInstruction,
  buildInstructionMessage,
  instructionText,
  isInstructionMessage,
  messageLanguage,
  sessionHasInstruction,
}
