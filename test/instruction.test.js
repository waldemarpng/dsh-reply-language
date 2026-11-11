import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyInstruction,
  buildInstructionMessage,
  instructionText,
  isInstructionMessage,
  messageLanguage,
  sessionHasInstruction,
} from '../lib/instruction.js'

function stubAgent(events) {
  const bySeq = new Map(events.map((event, index) => [index + 1, event]))
  return {
    session: {
      surface: { nodes: [...bySeq.keys()] },
      eventAt: (seq) => bySeq.get(seq) || null,
    },
  }
}

function instruction(id, language) {
  return { id, role: 'user', content: [{ type: 'text', text: 'pin ' + language }], source: { kind: 'reply-language', language } }
}

function userMessage(text) {
  return { id: 'u-' + text, role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }
}

test('auto language produces no instruction message', () => {
  assert.equal(buildInstructionMessage('auto'), undefined)
})

test('instruction message shape', () => {
  const message = buildInstructionMessage('ru')
  assert.equal(message.role, 'user')
  assert.equal(typeof message.id, 'string')
  assert.ok(message.id.length > 10)
  assert.deepEqual(message.source, { kind: 'reply-language', language: 'ru' })
  assert.equal(message.content.length, 1)
  assert.equal(message.content[0].type, 'text')
  assert.ok(message.content[0].text.includes('Russian'))
  assert.ok(Object.isFrozen(message))
  assert.ok(Object.isFrozen(message.content))
  assert.ok(Object.isFrozen(message.source))
})

test('instruction text keeps code exceptions', () => {
  const text = instructionText('Russian')
  assert.ok(text.startsWith('Write every user-visible reply in Russian.'))
  assert.ok(text.includes('Keep code, identifiers, commands, file paths'))
  assert.ok(text.includes('overrides this rule'))
})

test('unknown language id produces no instruction message', () => {
  assert.equal(buildInstructionMessage('klingon'), undefined)
})

test('isInstructionMessage and messageLanguage', () => {
  assert.equal(isInstructionMessage(userMessage('hi')), false)
  assert.equal(isInstructionMessage(null), false)
  assert.equal(isInstructionMessage(instruction('a', 'ru')), true)
  assert.equal(messageLanguage(instruction('a', 'ru')), 'ru')
  assert.equal(messageLanguage(userMessage('hi')), undefined)
})

test('applyInstruction appends when nothing claimed', () => {
  const decision = { kind: 'claim', messages: [userMessage('hello')] }
  const next = applyInstruction(decision, stubAgent([]), { language: 'ru', enabled: true })
  assert.equal(next.messages.length, 2)
  assert.equal(next.messages[0].content[0].text, 'hello')
  assert.equal(next.messages[1].source.language, 'ru')
  assert.equal(next.kind, 'claim')
  assert.notEqual(next, decision)
})

test('applyInstruction skips when the same language is already claimed', () => {
  const decision = { kind: 'claim', messages: [userMessage('hello'), instruction('x1', 'ru')] }
  const next = applyInstruction(decision, stubAgent([]), { language: 'ru', enabled: true })
  assert.equal(next, decision)
})

test('applyInstruction replaces a claimed instruction for another language', () => {
  const decision = { kind: 'claim', messages: [instruction('x1', 'de'), userMessage('hello')] }
  const next = applyInstruction(decision, stubAgent([]), { language: 'ru', enabled: true })
  assert.equal(next.messages.length, 2)
  assert.equal(next.messages[0].content[0].text, 'hello')
  assert.equal(next.messages[1].source.language, 'ru')
})

test('applyInstruction skips when the session already carries the instruction', () => {
  const agent = stubAgent([{ type: 'user/message', data: userMessage('old') }, { type: 'user/message', data: instruction('x0', 'ru') }])
  const decision = { kind: 'claim', messages: [userMessage('hello')] }
  const next = applyInstruction(decision, agent, { language: 'ru', enabled: true })
  assert.equal(next, decision)
  assert.equal(sessionHasInstruction(agent, 'ru'), true)
  assert.equal(sessionHasInstruction(agent, 'de'), false)
})

test('applyInstruction strips claimed instructions when disabled', () => {
  const decision = { kind: 'claim', messages: [instruction('x1', 'ru'), userMessage('hello'), instruction('x2', 'de')] }
  const next = applyInstruction(decision, stubAgent([]), { language: 'ru', enabled: false })
  assert.equal(next.messages.length, 1)
  assert.equal(next.messages[0].content[0].text, 'hello')
})

test('applyInstruction returns decision untouched for auto without claimed instructions', () => {
  const decision = { kind: 'claim', messages: [userMessage('hello')] }
  const next = applyInstruction(decision, stubAgent([]), { language: 'auto', enabled: true })
  assert.equal(next, decision)
})

test('applyInstruction leaves reject decisions alone', () => {
  const decision = { kind: 'reject', messages: [] }
  assert.equal(applyInstruction(decision, stubAgent([]), { language: 'ru', enabled: true }), decision)
})

test('applyInstruction tolerates decisions without messages', () => {
  const decision = { kind: 'claim' }
  assert.equal(applyInstruction(decision, stubAgent([]), { language: 'ru', enabled: true }), decision)
  assert.equal(applyInstruction(null, stubAgent([]), { language: 'ru', enabled: true }), null)
})

test('sessionHasInstruction tolerates a missing surface', () => {
  assert.equal(sessionHasInstruction({}, 'ru'), false)
  assert.equal(sessionHasInstruction({ session: {} }, 'ru'), false)
  assert.equal(sessionHasInstruction({ session: { surface: {}, eventAt: () => null } }, 'ru'), false)
  assert.equal(sessionHasInstruction({ session: { surface: { nodes: [1] }, eventAt: () => { throw new Error('boom') } } }, 'ru'), false)
})
