import type { Context } from 'hono'

const STARTED_AT = Date.now()

export function handleHealth(c: Context): Response {
  return c.json({
    ok: true,
    uptime_seconds: Math.floor((Date.now() - STARTED_AT) / 1000),
  })
}
