# telemachus-mattermost

A small connector that lets you talk to [Telemachus](https://github.com/dadawg/telemachus) from Mattermost. One Telemachus session per Mattermost channel; replies stream back via Mattermost's incoming webhook.

## Why this exists

[Telemachus](https://github.com/dadawg/telemachus) is a self-hosted multi-provider AI agent built by [Kristo Disha](https://github.com/dadawg). It already supports Discord and Telegram as transports. I built this connector because most of the regulated-software teams I work with as a freelancer **can't put their data in Slack or Discord** — they run Mattermost (or a comparable self-hosted chat) for that reason. Mattermost is what dialysis clinics, banks, and gov labs actually run.

This bridge means the same Telemachus workflows (provider routing, prompt caching, multi-agent orchestration) work without their data ever leaving the org's infrastructure.

## How it works

```
Mattermost channel
       │
       │  outgoing webhook (5s window)
       ▼
  telemachus-mattermost (this repo)
       │
       │  POST /api/sessions/:id/chat
       │  Bearer auth, SSE response
       ▼
       Telemachus server
       │
       │  agent loop, provider call, streaming reply
       ▼
  telemachus-mattermost
       │
       │  incoming webhook
       ▼
Mattermost channel (agent reply)
```

The 5s outgoing-webhook window means agent turns longer than ~5s would time out if the bot tried to reply directly. So the bot ACKs immediately and posts replies asynchronously via the incoming webhook. The user sees: their message, then the reply when the agent finishes.

## Setup

See [`docs/setup-mattermost.md`](docs/setup-mattermost.md) for the Mattermost-side configuration.

Bot side:

```bash
git clone https://github.com/Toska30/telemachus-mattermost
cd telemachus-mattermost
cp .env.example .env
# fill in TELEMACHUS_URL, TELEMACHUS_TOKEN, MATTERMOST_WEBHOOK_URL
npm install
npm run dev
```

## Architecture notes

- **One session per channel.** Channel = conversation. If you want per-user conversations, key the session map on `user_id` instead of `channel_id` (see `src/handlers/incoming.ts`).
- **In-memory session map.** Restart wipes session memory. For persistence, swap `createInMemorySessionMap` with a redis-backed implementation behind the same `SessionMap` interface (`src/session-map.ts`).
- **No per-token streaming.** Mattermost incoming webhooks don't support efficient in-place edits, so streaming-per-token would mean posting partial messages repeatedly. The bot buffers and posts once. For typing-indicator behavior, use Mattermost's bot framework instead of webhooks (not covered here).
- **No tool-call surfacing.** When Telemachus calls a tool (read, web search, etc.) the events are filtered out before reaching Mattermost — only the agent's natural-language reply lands in the channel. If you want tool transparency, modify `src/sse-parser.ts` to surface other event types.

## Stack

- Node 20+
- TypeScript
- [Hono](https://hono.dev) for the HTTP server (Express-shaped, lightweight, runtime-agnostic)
- [Zod](https://zod.dev) for env validation
- [Vitest](https://vitest.dev) for tests
- [Biome](https://biomejs.dev) for lint/format

Total: about 400 lines of source, including tests.

## Run the tests

```bash
npm test
```

## Attribution

This is a third-party connector for the Telemachus project. Telemachus itself is by [Kristo Disha](https://github.com/dadawg) — I built this bridge as an extension while collaborating with him on the project. The Telemachus project documents its public HTTP API; this repo only depends on that contract, not on internal modules.

## License

MIT. See [`LICENSE`](LICENSE).
