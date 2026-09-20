# Host your own Moor

Anyone can run a private instance. The desktop session lives in the browser (IndexedDB). The server is only there to ship the app.

You need **Node.js 22+** and **npm 10+**. Git is enough to get the source.

## 1. Get the source

```bash
git clone https://github.com/kaiser6k/moor-linux.git
cd moor-linux
cp env.example .env
npm install
```

`.env` turns platform sign-in **off**. Moor’s own users (`moor`, `root`, accounts you add) are local to the browser — they are not this flag.

## 2. Run it on your machine

```bash
npm run dev
```

Open the URL the command prints (by default it listens on every interface, port 8080).

On an iPhone on the same network, use `http://<your-computer-ip>:8080`. For Add to Home Screen, share sheet, and a PWA that behaves, put **HTTPS** in front (see [TLS](#tls--iphone)).

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Live reload while you hack |
| `npm run build` | Production bundle |
| `npm run preview` | Serve the production bundle |
| `npm run typecheck` | TypeScript |

## 3. Production on a VPS

```bash
cp env.example .env
npm install
npm run build
npx vite preview --host 0.0.0.0 --port 3000
```

Put Caddy, nginx, or Cloudflare in front of port 3000. Keep `VITE_AUTH_ENABLED=false` in `.env` **before** `npm run build` — Vite bakes that flag into the client.

### systemd sketch

```ini
[Service]
WorkingDirectory=/opt/moor-linux
EnvironmentFile=/opt/moor-linux/.env
ExecStart=/usr/bin/npx vite preview --host 127.0.0.1 --port 3000
Restart=on-failure
```

## 4. Vercel

1. Fork [kaiser6k/moor-linux](https://github.com/kaiser6k/moor-linux).
2. [Import the fork into Vercel](https://vercel.com/new).
3. Set env:
   - `VITE_AUTH_ENABLED` = `false`
   - Node.js **22**
4. Deploy. The build already uses Nitro’s Vercel preset.

`DATABASE_URL` is optional. Do not set it unless you also turn auth on and know what that implies.

## 5. Docker

```bash
docker compose up --build
```

The compose file publishes port **3000**. Point a reverse proxy at it.

```bash
docker build -t moor-linux .
docker run --rm -p 3000:3000 -e VITE_AUTH_ENABLED=false moor-linux
```

## TLS / iPhone

Safari will add a page to the Home Screen over HTTP on your LAN, but **Save to phone**, the share sheet, and a standalone PWA are reliable only on **HTTPS**.

Caddy in front of the preview server:

```caddy
moor.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Then on the iPhone:

1. Open the HTTPS URL in Safari.
2. Share → **Add to Home Screen**.
3. Open Moor from the icon.
4. Plug USB-C into a display and start a session.

Details: [ios.md](ios.md).

## What this instance stores

| Where | What |
| --- | --- |
| Browser IndexedDB | Home folder, wallpaper, containers, OS users |
| iOS Files / Photos | Only what you **Save to phone** |
| Server disk | The app files. No user documents unless you add that. |

Clearing the site data in Safari wipes the session. Export from **Settings → Export home to phone** if you care.

## Fork notes

- MIT. Keep the license.
- Rename the window title in `src/routes/__root.tsx` (`APP_NAME`) and `src/lib/og/site.json` if you ship a branded fork.
- Do not enable `VITE_AUTH_ENABLED=true` unless you have an auth broker. Moor’s Users app does not use that flag.

## Help

Issues and PRs: [github.com/kaiser6k/moor-linux](https://github.com/kaiser6k/moor-linux).
