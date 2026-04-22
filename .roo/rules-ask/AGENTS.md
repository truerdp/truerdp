# Project Documentation Rules (Non-Obvious Only)

- Canonical HTTP client behavior lives in packages/api; use these as the source of truth:
  - [fetcher()](packages/api/src/fetcher.ts:76) (credentials: "include", X-Requested-With, default JSON body on POST/PUT/PATCH)
  - [clientApi()](packages/api/src/client.ts:15) (browser; base URL precedence)
  - [serverApi()](packages/api/src/server.ts:39) (Next server; forwards cookies via next/headers)

- NEXT_PUBLIC_API_URL is injected by each app’s Next config by reading the repo-root .env (not app-local) with a dev fallback http://localhost:3003. Restart dev servers after editing .env:
  - [readRootEnvValue()](apps/web/next.config.mjs:8)
  - [typedRoutes + env wiring](apps/dashboard/next.config.mjs:35)
  - [globalEnv](turbo.json:4)

- Backend endpoints are mounted centrally; consult this file to discover route entry points (auth, user, plan, order, transaction, admin, instance, webhook):
  - [apps/backend/src/index.ts](apps/backend/src/index.ts:67)

- CORS documentation nuance: a second origin check runs for mutating methods; even with the CORS plugin, missing CORS_ALLOWED_ORIGINS in production returns 403:
  - [apps/backend/src/index.ts](apps/backend/src/index.ts:51)

- Business flow reference (billing chain and app scopes) is in the root README; prefer these sections over guessing flows:
  - [README.md](README.md:16)

- Webhook documentation and gotchas (raw body requirement for signature validation):
  - [RAZORPAY_WEBHOOKS.md](RAZORPAY_WEBHOOKS.md:1)
  - Runtime implementation reference: [webhookRoutes()](apps/backend/src/routes/webhook.ts:10)

- Path helpers are the canonical source for typed routes in apps; follow these shapes instead of hardcoding strings:
  - [webPaths](apps/web/lib/paths.ts:3), [dashboardPaths](apps/dashboard/lib/paths.ts:3), [adminPaths](apps/admin/lib/paths.ts:3)

- Running specific workspaces (docs canonical commands):
  - [README.md](README.md:166)

- Import boundaries in Next apps: import only via package exports (transpilePackages); deep relative imports across packages are disallowed:
  - [packages/ui/package.json](packages/ui/package.json:47), [packages/api/package.json](packages/api/package.json:17)
