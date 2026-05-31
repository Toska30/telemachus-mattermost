import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { loadConfig } from './config.js'
import { TelemachusClient } from './telemachus-client.js'
import { MattermostClient } from './mattermost-client.js'
import { createInMemorySessionMap } from './session-map.js'
import { handleIncoming } from './handlers/incoming.js'
import { handleHealth } from './handlers/health.js'

function main(): void {
  const config = loadConfig()

  const telemachus = new TelemachusClient({
    baseUrl: config.telemachusUrl,
    token: config.telemachusToken,
  })
  const mattermost = new MattermostClient(config.mattermostWebhookUrl)
  const sessionMap = createInMemorySessionMap()

  const app = new Hono()
  app.get('/health', handleHealth)
  app.post('/webhook', (c) =>
    handleIncoming(c, {
      telemachus,
      mattermost,
      sessionMap,
      expectedToken: config.mattermostOutgoingToken,
    }),
  )

  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`telemachus-mattermost listening on :${info.port}`)
  })
}

main()
