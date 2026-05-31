import { describe, it, expect } from 'vitest'
import { createInMemorySessionMap } from '../session-map.js'

describe('createInMemorySessionMap', () => {
  it('returns undefined for unknown channel', () => {
    const map = createInMemorySessionMap()
    expect(map.get('channel-1')).toBeUndefined()
  })

  it('stores and retrieves a session id by channel', () => {
    const map = createInMemorySessionMap()
    map.set('channel-1', 'session-abc')
    expect(map.get('channel-1')).toBe('session-abc')
  })

  it('overwrites existing session for the same channel', () => {
    const map = createInMemorySessionMap()
    map.set('channel-1', 'session-abc')
    map.set('channel-1', 'session-xyz')
    expect(map.get('channel-1')).toBe('session-xyz')
  })

  it('keeps separate sessions for separate channels', () => {
    const map = createInMemorySessionMap()
    map.set('channel-1', 'session-1')
    map.set('channel-2', 'session-2')
    expect(map.get('channel-1')).toBe('session-1')
    expect(map.get('channel-2')).toBe('session-2')
  })
})
