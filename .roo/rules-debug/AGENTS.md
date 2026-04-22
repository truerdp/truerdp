# Project Debug Rules (Non-Obvious Only)

- 403 on POST/PUT/PATCH despite CORS plugin:
  - Backend performs a second origin check for mutating methods in an onRequest hook. In production set CORS_ALLOWED_ORIGINS (comma-separated) to site origins or requests are blocked. See [onRequest hook](apps/backend/src/index.ts:51).

- Webhook "Invalid signature":
  - Razorpay verification expects exact raw payload bytes. Fastify doesn't populate request.rawBody by default. Register fastify-raw-body early (runFirst) or supply the exact raw bytes; JSON.stringify(request.body) often mismatches provider HMAC. See [webhookRoutes()](apps/backend/src/routes/webhook.ts:10) and rawBody usage at [request.rawBody](apps/backend/src/routes/webhook.ts:26).

- Port collisions and double backend:
  - Do not run pnpm dev concurrently with pnpm run dev:docker; you'll start two backend instances (Docker + local). Use pnpm run dev:stop to kill 3000–3003. See startup notes in [README](README.md:103).

- Frontend API base env not taking effect:
  - NEXT_PUBLIC_API_URL is injected via Next config reading the repo-root .env. Turbo exposes it via globalEnv; after changing .env restart dev servers. See [globalEnv](turbo.json:4) and [readRootEnvValue()](apps/web/next.config.mjs:8).

- Missing auth cookies on SSR/API calls:
  - Server-side calls must use [serverApi()](packages/api/src/server.ts:39), which rebuilds Cookie from next/headers ([buildCookieHeader](packages/api/src/server.ts:28)). Client-side calls must use [clientApi()](packages/api/src/client.ts:15).

- Unexpected backend rejects due to headers:
  - The shared [fetcher()](packages/api/src/fetcher.ts:76) always sets X-Requested-With and credentials: "include". If you bypass it with fetch(), CORS/preflight or session may fail.
