/**
 * Minimal Server-Sent Events parser for the Telemachus chat stream.
 *
 * Telemachus emits events of shape: `event: <name>\ndata: <json>\n\n`.
 * We surface only the `delta` (incremental token) and `done` (final) events
 * to the caller — everything else (status, tool-call, etc.) is ignored on
 * purpose. The bot doesn't need them; surfacing them would leak agent
 * internals into Mattermost.
 */

export interface SseDelta {
  type: 'delta'
  text: string
}

export interface SseDone {
  type: 'done'
}

export type SseEvent = SseDelta | SseDone

/**
 * Parse a single raw SSE event block ("event: x\ndata: y") into a typed
 * event. Returns null when the event is not one we care about, or when
 * the data is malformed (we swallow malformed events rather than crash —
 * the agent may emit forms we don't yet handle).
 */
export function parseSseEvent(block: string): SseEvent | null {
  const lines = block.split('\n')
  let eventName = 'message'
  let data = ''
  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim()
    }
  }
  if (eventName === 'done') return { type: 'done' }
  if (eventName !== 'delta') return null
  try {
    const json = JSON.parse(data) as { text?: unknown }
    if (typeof json.text !== 'string') return null
    return { type: 'delta', text: json.text }
  } catch {
    return null
  }
}

/**
 * Generator that consumes a fetch-Response SSE body and yields typed events.
 * Buffers incomplete events across chunks — SSE event blocks are separated by
 * double newlines but a chunk may split a block in the middle.
 */
export async function* readSseStream(response: Response): AsyncGenerator<SseEvent> {
  if (!response.body) return
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let sep = buffer.indexOf('\n\n')
    while (sep !== -1) {
      const block = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const event = parseSseEvent(block)
      if (event) yield event
      if (event?.type === 'done') return
      sep = buffer.indexOf('\n\n')
    }
  }
}
