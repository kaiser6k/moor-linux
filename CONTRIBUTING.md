# Contributing

Moor is MIT. Forks and PRs are welcome.

## Dev

```bash
git clone https://github.com/kaiser6k/moor-linux.git
cd moor-linux
cp env.example .env
npm install
npm run dev
```

Before a PR:

```bash
npm run typecheck
```

## Scope

The product is a **userspace** Linux desktop for a docked iPhone. It is not a kernel, not Docker-on-iOS, and not a cloud VM. Keep that honest in UI copy.

Design: dark canvas, teal primary, existing tokens in `src/styles.css`. No emoji in the chrome.

## Docs

Self-host and iPhone setup live in [`docs/`](docs/self-host.md). Update those when you change how the app boots or deploys.
