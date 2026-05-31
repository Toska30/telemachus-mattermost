# Mattermost setup

This connector needs two webhooks on the Mattermost side:

1. **Outgoing webhook** — Mattermost calls this bot whenever a message is posted in a watched channel.
2. **Incoming webhook** — this bot calls Mattermost to post the agent's reply.

## 1. Create the incoming webhook (for replies)

System Console → Integrations → Incoming Webhooks → Add.

- Channel: pick the channel where replies should appear
- Display name: e.g. *Telemachus*
- Username: e.g. *telemachus-bot*

Copy the webhook URL. It looks like `https://mattermost.example.com/hooks/xxxx`. Put it in `.env` as `MATTERMOST_WEBHOOK_URL`.

## 2. Create the outgoing webhook (for incoming messages)

System Console → Integrations → Outgoing Webhooks → Add.

- Channel: same channel as above
- Trigger words: leave empty to forward every message, or set e.g. `tm` so only `tm what's the weather` is forwarded
- Callback URL: the public URL of this bot, e.g. `https://your-bot.example.com/webhook`
- Content type: `application/x-www-form-urlencoded` (Mattermost default)

Mattermost generates a token. Put it in `.env` as `MATTERMOST_OUTGOING_TOKEN` so the bot can verify incoming requests came from your Mattermost instance.

## 3. Configure the bot

Copy `.env.example` to `.env`, fill in the values:

```env
TELEMACHUS_URL=http://your-telemachus:8080
TELEMACHUS_TOKEN=...               # Telemachus bearer token
MATTERMOST_WEBHOOK_URL=...         # from step 1
MATTERMOST_OUTGOING_TOKEN=...      # from step 2
PORT=3000
```

## 4. Run

```bash
npm install
npm run dev
```

Or build and run:

```bash
npm install
npm run build
npm start
```

## Verify

Health check: `curl http://localhost:3000/health` → `{"ok":true,"uptime_seconds":...}`.

Post a message in the watched Mattermost channel. The agent should reply within a few seconds.

## Notes

- One Telemachus session per Mattermost channel. Channel = conversation. Restart wipes session memory (it's in-memory only).
- Mattermost outgoing webhooks have a 5s response window. The bot ACKs immediately and posts replies asynchronously via the incoming webhook, so long-running agent turns don't time out.
- Streaming-per-token isn't supported via webhooks. The bot buffers the full reply and posts once. For typing-indicator behavior, run a custom integration via Mattermost's bot framework (not covered here).
