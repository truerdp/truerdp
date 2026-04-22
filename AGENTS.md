# AGENTS.md

This file provides guidance to agents when working with code in this repository.

Non-obvious, project-specific conventions discovered by reading the code:

- Dev/run commands (intentional flow control)
  - Use pnpm 10.29.3 (pinned in root packageManager) and Node ≥20.
  - pnpm run dev:docker starts DB+backend in Docker then frontends locally; do not run pnpm dev alongside this (backend would be double-started). See README “Daily Startup.”
  - pnpm run dev:frontend starts only web, dashboard, admin with turborepo filters.
  - pnpm run dev:stop aggressively kills ports 3000–3003; use it to recover from orphan Next/Fastify processes.

- Frontend API base URL resolution (custom fallback)
  - NEXT_PUBLIC_API_URL is injected at build via app next.config.mjs reading the repo-root .env if not set in process.env, with a dev default http://localhost:3003. See [readRootEnvValue()](apps/web/next.config.mjs:8) and [nextPublicApiUrl](apps/dashboard/next.config.mjs:28).
  - Turbo exposes NEXT_PUBLIC_API_URL via globalEnv; if you change the root .env, restart dev servers to pick up the change. See [turbo.json](turbo.json:4).

- API client wrappers (use these, not raw fetch)
  - Browser: [clientApi()](packages/api/src/client.ts:15) uses base URL precedence and credentials: include.
  - Next server components/route handlers: [serverApi()](packages/api/src/server.ts:39) forwards cookies via next/headers; not safe outside Next runtime.
  - Shared: [fetcher()](packages/api/src/fetcher.ts:76) auto-JSON-serializes non-FormData bodies and for POST/PUT/PATCH sends {} if body is null; to avoid JSON set body to FormData, string, or URLSearchParams.

- CORS coupling
  - Backend enforces an additional origin check for mutating methods in onRequest; misconfigured CORS_ALLOWED_ORIGINS yields 403 even if CORS is enabled. See [index.ts](apps/backend/src/index.ts:51).

- Webhook signatures (Razorpay)
  - [webhookRoutes()](apps/backend/src/routes/webhook.ts:10) verifies signatures using request.rawBody; Fastify does not provide this by default. Add fastify-raw-body (runFirst) or supply the exact raw payload. JSON.stringify fallback may not match provider’s HMAC.

- Lint/format/types
  - ESLint uses only-warn (warnings) and turbo plugin (env var checks).
  - Prettier: no semicolons, double quotes, width 80; Tailwind sorting is driven by [globals.css](packages/ui/src/styles/globals.css:1); functions recognized: cn, cva. See [.prettierrc](.prettierrc:1).
  - TypeScript strict mode with noUncheckedIndexedAccess and moduleDetection: force. Prefer import type for types.

- Routing types
  - Next typedRoutes is enabled in dashboard ([typedRoutes](apps/dashboard/next.config.mjs:35)). Route maps return Route and dynamic helpers are explicitly typed (e.g., [dashboardPaths](apps/dashboard/lib/paths.ts:3), [webPaths](apps/web/lib/paths.ts:3), [adminPaths](apps/admin/lib/paths.ts:3)).

- Monorepo package boundaries
  - Next apps transpile ["@workspace/ui", "@workspace/api"]; import via package exports, not deep relative paths. See [packages/ui/package.json](packages/ui/package.json:47) and [packages/api/package.json](packages/api/package.json:17).

Testing

- No test runner configured; single-test invocation is not applicable until a framework is added.
