# Contributing to VoltChat template

## Quick start (npm or bun — both supported)

```bash
# 1. Clone
git clone <your-fork-url> && cd voltchat-template

# 2. Env (required — `.env` is gitignored, `.env.example` is the source of truth)
cp .env.example .env

# 3a. With npm
npm install
npm run dev        # http://localhost:8026

# 3b. With bun
bun install
bun run dev
```

Leave `VITE_WEBHOOK_URL` empty to explore **demo mode**, or point it at your backend
(see `docs/BACKEND_CONTRACT.md`). For a zero-dependency fake backend:

```bash
npm run mock       # serves /chat + /upload on http://localhost:9732
```

## Checks before opening a PR

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

CI runs the same matrix on Node 20 + 22 with both npm and bun.

## Conventions

- App config lives in `src/config.ts` — add new `VITE_*` keys there (zod schema) **and**
  document them in `.env.example` + `docs/THEMING.md`.
- Backend transports live in `src/lib/backends/` — add helpers there rather than
  calling `fetch(webhookUrl)` directly from hooks/components.
- Demo content lives in `src/lib/backends/demo.ts` only, so forks can delete that
  one file (and its test) to strip demo mode.
- Keep `README.md` template-generic: no hardcoded product names outside `VITE_APP_*`.
