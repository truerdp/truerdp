# Project Architecture Rules (Non-Obvious Only)

- API base URL precedence:
  - Server-side calls resolve INTERNAL_API_URL → NEXT_PUBLIC_API_URL → "" (see getBaseUrl in [language.declaration()](packages/api/src/server.ts:22) and [language.declaration()](packages/api/src/client.ts:9)). Prefer INTERNAL_API_URL in deployments (frontends ↔ API on same network) to bypass public CORS.

- SSR cookie propagation contract:
  - [language.declaration()](packages/api/src/server.ts:39) reconstructs Cookie from Next’s cookies() ([language.declaration()](packages/api/src/server.ts:28)). It must run inside Next runtime; do not use in generic Node/Hono/Fastify contexts.

- Client wrapper + CORS coupling:
  - [language.declaration()](packages/api/src/fetcher.ts:76) always sets credentials: "include" and X-Requested-With. Backend allows this header and still applies a second origin check for mutating methods via onRequest; missing allowlist yields 403 even with CORS plugin. See [filename](apps/backend/src/index.ts:49).

- Frontend env wiring via root .env:
  - Each app injects NEXT_PUBLIC_API_URL from repo-root .env if not already set, with a dev default http://localhost:3003. Restart dev after edits (Turbo globalEnv caching). See [filename](apps/web/next.config.mjs:8), [filename](apps/dashboard/next.config.mjs:28), and [filename](turbo.json:4).

- Default JSON bodies on mutating requests:
  - For POST/PUT/PATCH with null/undefined body, [language.declaration()](packages/api/src/fetcher.ts:76) sends {} and Content-Type: application/json. If the endpoint expects no body or a non-JSON payload, pass FormData/string/URLSearchParams explicitly.

- Webhook integrity depends on raw payload bytes:
  - Razorpay verification uses request.rawBody when available; Fastify does not supply it by default. Install/enable fastify-raw-body early or deliver exact raw bytes. JSON re-serialization changes HMAC. See [filename](apps/backend/src/routes/webhook.ts:26).

- Monorepo import boundaries:
  - Next apps transpile ["@workspace/ui", "@workspace/api"]; import via package exports only. Cross-package deep relative paths are not supported. See [filename](packages/ui/package.json:47) and [filename](packages/api/package.json:17).

- Typed route surfaces:
  - Path helpers return/cast Next Route types; preserve these types for navigation/build-time checks (typedRoutes enabled). See [filename](apps/dashboard/next.config.mjs:35) and helpers [filename](apps/web/lib/paths.ts:3), [filename](apps/dashboard/lib/paths.ts:3), [filename](apps/admin/lib/paths.ts:3).

- Dev topology contract:
  - Docker compose runs DB+backend on port 3003; frontends run locally. Do not start a second backend via pnpm dev when dev:docker is active. Use pnpm run dev:stop to kill 3000–3003 if needed. See [filename](docker-compose.yml:21) and [filename](README.md:103).

- Billing data path dependency:
  - End-to-end billing flows rely on current Drizzle migrations; schema drift will break invoices/transactions. Before debugging checkout/renewals, run backend db:migrate/seed. See [filename](README.md:175).
