/**
 * Mattermost incoming-webhook client. One method: post a message to the
 * channel the webhook is bound to.
 *
 * Mattermost incoming webhooks accept a JSON body with `text` (markdown)
 * and respond 200 OK on success. We don't use response-mode webhooks
 * because they don't support streaming-style updates.
 */
export class MattermostClient {
  constructor(private webhookUrl: string) {}

  async post(text: string): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      throw new Error(`Mattermost post failed: ${response.status} ${response.statusText}`)
    }
  }
}
