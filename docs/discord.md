# Moor Discord bot

The bot brands a server as Moor (icon, channels, Docked role, welcome post) and exposes a small admin API so Grok can manage it from chat once you host it.

It cannot log into Discord as you. You create the application; the bot does the clicking.

## 1. Create the app

1. Open [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** → name it `Moor`.
2. **Bot** → **Reset Token** → copy it. Turn **Public Bot** off if this is only your server.
3. **OAuth2 → General** → copy **Client ID**.
4. **OAuth2 → URL Generator**
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: **Administrator** (a personal server; the commands already require Admin)
   - Copy the URL, open it, pick your server, authorize.
5. Discord → Server Settings → **Apps** → confirm Moor is in the member list. Copy the **Server ID** (Developer Mode → right-click server → Copy Server ID).

## 2. Run it

```bash
cd discord
cp env.example .env
# paste DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, ADMIN_SECRET
npm install
set -a && source .env && set +a
npm start
```

Leave it running. In Discord type:

- `/moor-setup` — icon, name `Moor`, `#welcome` `#general` `#support` `#showcase`, **Docked** role, welcome embed
- `/moor-announce` — post as the bot
- `/moor-status`

## 3. Let Grok manage it

The bot also listens for HTTP (default port **8787**):

| Method | Path | Body |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/guild` | — |
| POST | `/setup` | — |
| POST | `/announce` | `{ "channel": "general", "message": "…" }` |

All except `/health` need `Authorization: Bearer ADMIN_SECRET`.

Put HTTPS in front (Caddy, Cloudflare Tunnel, ngrok). Then in this chat send:

- the public URL (for example `https://discord.example.com`)
- `ADMIN_SECRET`

Do **not** paste `DISCORD_TOKEN` here.

After that, ask to rename a channel, run setup, or post an announcement — Grok will call the API.

## Docker

From the repo root:

```bash
docker build -f discord/Dockerfile -t moor-discord .
docker run --rm --env-file discord/.env -p 8787:8787 moor-discord
```
