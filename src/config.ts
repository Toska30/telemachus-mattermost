import { z } from 'zod'

const ConfigSchema = z.object({
  telemachusUrl: z.string().url(),
  telemachusToken: z.string().min(1),
  mattermostWebhookUrl: z.string().url(),
  mattermostOutgoingToken: z.string().optional(),
  port: z.number().int().positive(),
})

export type Config = z.infer<typeof ConfigSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const raw = {
    telemachusUrl: env.TELEMACHUS_URL,
    telemachusToken: env.TELEMACHUS_TOKEN,
    mattermostWebhookUrl: env.MATTERMOST_WEBHOOK_URL,
    mattermostOutgoingToken: env.MATTERMOST_OUTGOING_TOKEN,
    port: Number(env.PORT ?? 3000),
  }
  const parsed = ConfigSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid configuration:\n${issues}\nSee .env.example for the expected shape.`)
  }
  return parsed.data
}
