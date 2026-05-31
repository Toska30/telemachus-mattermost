/**
 * Thin HTTP client for the Telemachus server API.
 *
 * Telemachus exposes:
 *   POST /api/sessions          → create session, returns { id }
 *   POST /api/sessions/:id/chat → submit message, returns SSE stream
 *
 * All /api/* routes require Bearer auth.
 */
import { readSseStream, type SseEvent } from './sse-parser.js'

export interface TelemachusClientOpts {
  baseUrl: string
  token: string
}

export class TelemachusClient {
  constructor(private opts: TelemachusClientOpts) {}

  private headers(): Record<string, string> {
    return {
      authorization: `Bearer ${this.opts.token}`,
      'content-type': 'application/json',
    }
  }

  async createSession(): Promise<string> {
    const response = await fetch(`${this.opts.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: this.headers(),
      body: '{}',
    })
    if (!response.ok) {
      throw new Error(`Telemachus createSession failed: ${response.status} ${response.statusText}`)
    }
    const body = (await response.json()) as { id?: string }
    if (!body.id) throw new Error('Telemachus createSession returned no id')
    return body.id
  }

  async *chat(sessionId: string, message: string): AsyncGenerator<SseEvent> {
    const response = await fetch(`${this.opts.baseUrl}/api/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ message }),
    })
    if (!response.ok) {
      throw new Error(`Telemachus chat failed: ${response.status} ${response.statusText}`)
    }
    yield* readSseStream(response)
  }
}
