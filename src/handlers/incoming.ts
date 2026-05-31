/**
 * POST /webhook — Mattermost outgoing webhook hits this with each message
 * in the channels it's wired to.
 *
 * Mattermost sends: { token, channel_id, user_name, text, ... }
 *
 * We:
 *   1. Verify the shared-secret token (if configured)
 *   2. Look up or create the Telemachus session for this channel
 *   3. Stream Telemachus's reply back to Mattermost via the incoming webhook
 *
 * We respond 200 OK to Mattermost immediately and stream replies async —
 * Mattermost outgoing webhooks have a 5s response window, but agents
 * routinely take longer. The pattern is: ack immediately, post replies
 * via the incoming webhook.
 */
import type { Context } from 'hono'
import type { TelemachusClient } from '../telemachus-client.js'
import type { MattermostClient } from '../mattermost-client.js'
import type { SessionMap } from '../session-map.js'

export interface IncomingDeps {
  telemachus: TelemachusClient
  mattermost: MattermostClient
  sessionMap: SessionMap
  expectedToken?: string
}

export async function handleIncoming(c: Context, deps: IncomingDeps): Promise<Response> {
  const body = (await c.req.parseBody()) as Record<string, string>
  const { token, channel_id, text } = body

  if (deps.expectedToken && token !== deps.expectedToken) {
    return c.json({ error: 'invalid token' }, 401)
  }
  if (!channel_id || !text) {
    return c.json({ error: 'missing channel_id or text' }, 400)
  }

  // Fire-and-forget: stream the reply back via the incoming webhook so
  // Mattermost's 5s outgoing-webhook window doesn't time us out.
  void streamReply(text, channel_id, deps).catch((err) => {
    console.error('streamReply failed:', err)
    deps.mattermost.post(`_⚠ agent error: ${(err as Error).message}_`).catch(() => {})
  })

  return c.body(null, 200)
}

async function streamReply(
  message: string,
  channelId: string,
  deps: IncomingDeps,
): Promise<void> {
  let sessionId = deps.sessionMap.get(channelId)
  if (!sessionId) {
    sessionId = await deps.telemachus.createSession()
    deps.sessionMap.set(channelId, sessionId)
  }

  // Accumulate the full reply, then post once. Mattermost doesn't support
  // efficient in-place edits via webhooks, so streaming-edit would mean
  // posting partial messages repeatedly — noisy. One post per turn.
  let buffer = ''
  for await (const event of deps.telemachus.chat(sessionId, message)) {
    if (event.type === 'delta') buffer += event.text
  }
  if (buffer.trim().length > 0) {
    await deps.mattermost.post(buffer)
  }
}
