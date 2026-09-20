# Moor Discord bot

Public invite: [discord.gg/CNRYnGBayu](https://discord.gg/CNRYnGBayu)

The bot brands a server as Moor (icon, channels, Docked role, welcome post) and exposes a small admin API so Grok can manage it from chat once you host it.

It cannot log into Discord as you. You create the application; the bot does the clicking.

Works on **Windows 11** (PowerShell), macOS, and Linux. It loads `discord/.env` itself — you do not need bash.

## 0. Windows 11 prerequisites

In **PowerShell as Administrator**, once:

```powershell
winget install OpenJS.NodeJS.LTS Git.Git
```

Close PowerShell and open a new window so `node` and `git` are on PATH. Check:

```powershell
node -v
git --version
```

You want Node 22+. Discord desktop can stay logged in as usual.

## 1. Create the app

1. Open [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** → name it `Moor`.
2. **Bot** → **Reset Token** → copy it. Turn **Public Bot** off if this is only your server.
3. **OAuth2 → General** → copy **Client ID**.
4. **OAuth2 → URL Generator**
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: **Administrator** (a personal server; the commands already require Admin)
   - Copy the URL, open it, pick your server, authorize.
5. In the Discord app: **User Settings → Advanced → Developer Mode** on. Right-click the server name → **Copy Server ID**.

## 2. Run it (Windows 11)

PowerShell:

```powershell
git clone https://github.com/kaiser6k/moor-linux.git
cd moor-linux\discord
Copy-Item env.example .env
notepad .env
```

Paste these four values (no quotes):

```
DISCORD_TOKEN=the bot token
DISCORD_CLIENT_ID=the client id
DISCORD_GUILD_ID=the server id
ADMIN_SECRET=pick a long random string
```

Save, close Notepad, then:

```powershell
npm install
npm start
```

Leave that window open. You should see `Logged in as Moor#....`

In Discord type:

- `/moor-setup` — icon, name `Moor`, `#welcome` `#general` `#support` `#showcase`, **Docked** role, welcome embed
- `/moor-announce` — post as the bot
- `/moor-status`

If `/moor-setup` is missing, wait a minute and restart `npm start`. Guild commands register on boot.

## 3. Let Grok manage it

The bot also listens for HTTP (default port **8787**):

| Method | Path | Body |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/guild` | — |
| POST | `/setup` | — |
| POST | `/announce` | `{ "channel": "general", "message": "…" }` |

All except `/health` need `Authorization: Bearer ADMIN_SECRET`.

On Windows, easiest tunnel is [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) or [ngrok](https://ngrok.com/):

```powershell
winget install ngrok.ngrok
ngrok http 8787
```

Then in this chat send:

- the public `https://….ngrok-free.app` URL
- `ADMIN_SECRET`

Do **not** paste `DISCORD_TOKEN` here.

After that, ask to run setup, list channels, or post an announcement — Grok will call the API.

## Docker (optional)

Docker Desktop for Windows, from the repo root:

```powershell
docker build -f discord/Dockerfile -t moor-discord .
docker run --rm --env-file discord/.env -p 8787:8787 moor-discord
```
