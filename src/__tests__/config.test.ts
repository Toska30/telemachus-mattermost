import { describe, it, expect } from 'vitest'
import { loadConfig } from '../config.js'

describe('loadConfig', () => {
  const validEnv = {
    TELEMACHUS_URL: 'http://localhost:8080',
    TELEMACHUS_TOKEN: 'abc',
    MATTERMOST_WEBHOOK_URL: 'https://mm.example.com/hooks/abc',
    PORT: '4000',
  } as NodeJS.ProcessEnv

  it('parses a valid env', () => {
    const config = loadConfig(validEnv)
    expect(config.telemachusUrl).toBe('http://localhost:8080')
    expect(config.telemachusToken).toBe('abc')
    expect(config.port).toBe(4000)
  })

  it('defaults port to 3000 when PORT is unset', () => {
    const { PORT, ...withoutPort } = validEnv
    const config = loadConfig(withoutPort)
    expect(config.port).toBe(3000)
  })

  it('rejects missing TELEMACHUS_TOKEN', () => {
    const { TELEMACHUS_TOKEN, ...withoutToken } = validEnv
    expect(() => loadConfig(withoutToken)).toThrow(/TELEMACHUS_TOKEN|telemachusToken/i)
  })

  it('rejects invalid URL', () => {
    expect(() => loadConfig({ ...validEnv, TELEMACHUS_URL: 'not-a-url' })).toThrow()
  })

  it('passes optional MATTERMOST_OUTGOING_TOKEN through', () => {
    const config = loadConfig({ ...validEnv, MATTERMOST_OUTGOING_TOKEN: 'secret' })
    expect(config.mattermostOutgoingToken).toBe('secret')
  })
})
