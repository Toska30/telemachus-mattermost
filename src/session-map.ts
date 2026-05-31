/**
 * In-memory map of Mattermost channel-id → Telemachus session-id.
 *
 * One Telemachus session per Mattermost channel — keeps conversation
 * continuity at the channel level. This is intentionally not persisted to
 * disk: on restart, every channel starts a fresh session. If you want
 * persistence, swap this with a redis-backed implementation behind the
 * same interface.
 */
export interface SessionMap {
  get(channelId: string): string | undefined
  set(channelId: string, sessionId: string): void
}

export function createInMemorySessionMap(): SessionMap {
  const map = new Map<string, string>()
  return {
    get: (channelId) => map.get(channelId),
    set: (channelId, sessionId) => {
      map.set(channelId, sessionId)
    },
  }
}
