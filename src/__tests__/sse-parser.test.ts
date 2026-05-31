import { describe, it, expect } from 'vitest'
import { parseSseEvent } from '../sse-parser.js'

describe('parseSseEvent', () => {
  it('parses a delta event with text', () => {
    const block = 'event: delta\ndata: {"text":"hello"}'
    expect(parseSseEvent(block)).toEqual({ type: 'delta', text: 'hello' })
  })

  it('parses a done event', () => {
    const block = 'event: done\ndata: {}'
    expect(parseSseEvent(block)).toEqual({ type: 'done' })
  })

  it('returns null for unknown event types', () => {
    const block = 'event: tool_call\ndata: {"name":"read"}'
    expect(parseSseEvent(block)).toBeNull()
  })

  it('returns null for malformed delta JSON', () => {
    const block = 'event: delta\ndata: not-json'
    expect(parseSseEvent(block)).toBeNull()
  })

  it('returns null when delta has no text field', () => {
    const block = 'event: delta\ndata: {"other":"field"}'
    expect(parseSseEvent(block)).toBeNull()
  })

  it('handles missing event line (defaults to "message" which is unknown)', () => {
    const block = 'data: {"text":"hi"}'
    expect(parseSseEvent(block)).toBeNull()
  })
})
