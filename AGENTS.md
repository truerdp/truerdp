# AGENTS.md

This file guides coding agents working in this repository.
Focus: prevent hallucinations by forcing technology-accurate skills/tools.

## Current Stack (source of truth)

- Monorepo: `pnpm` workspaces + Turborepo (`apps/*`, `packages/*`)
- Frontend apps: Next.js 16 + React 19 (`apps/web`, `apps/dashboard`, `apps/admin`)
- Backend: Fastify 5 + Better Auth + Drizzle ORM + Postgres (`apps/backend`)
- Shared libs: `@workspace/api`, `@workspace/ui`
- Payments/providers in code: Dodo Payments, CoinGate
- Email in code: Resend integration
- MCP configured in repo: Better Auth (`mcp.json`)

If a proposed solution assumes Prisma, NextAuth, NestJS, Express, Stripe-only flows, or a test runner by default, that assumption is likely wrong for this repo.

## Mandatory Skill/MCP Routing (anti-hallucination)

Always pick skills/tools based on the tech actually used in the touched files.

- Better Auth work (`apps/backend/src/auth.ts`, `apps/backend/src/routes/better-auth.ts`, `apps/web/lib/auth-client.ts`)
  - Use: `create-auth-skill`, `better-auth-best-practices`
  - Use as needed: `email-and-password-best-practices`, `organization-best-practices`, `two-factor-authentication-best-practices`, `better-auth-security-best-practices`
  - Use Better Auth MCP from `mcp.json` when uncertain about Better Auth API/options. Do not invent Better Auth APIs.

- Fastify backend routes/hooks/plugins (`apps/backend/src/**`)
  - Use: `fastify-best-practices`
  - Preserve existing plugin/hook behavior unless explicitly changing it.

- Drizzle/Postgres schema/queries/migrations (`apps/backend/src/schema*`, `apps/backend/drizzle.config.ts`)
  - Use: `drizzle-orm`
  - Follow existing `postgres` + `drizzle-orm/postgres-js` pattern in `apps/backend/src/db.ts`; do not introduce a new ORM/query layer unless requested.

- Dodo billing/checkout/subscription/license/usage/webhooks (`apps/backend/src/services/dodo-payments*`, billing services)
  - Use: `dodo-best-practices`
  - Add specialized Dodo skills as needed: `checkout-integration`, `subscription-integration`, `usage-based-billing`, `credit-based-billing`, `license-keys`, `webhook-integration`.

- UI/component tasks in Next apps + shared UI package
  - Use: `shadcn` for shadcn component work
  - Use: `frontend-design` only when the user asks for redesign/major visual changes
  - Prefer existing components in `packages/ui/src/components` over adding duplicate primitives.

- Browser verification / local UX testing
  - Use: `agent-browser` for local browser interactions and validation.

- Email/testing flows
  - Use: `resend` skill when working on email delivery/testing patterns.

## Source-of-Truth Order

For implementation decisions, use this order:

1. Existing repo code (routes, services, schema, wrappers)
2. Repository-installed skills (`skills/` symlinks and `skills-lock.json`)
3. MCP tools configured for this repo (`mcp.json`, currently Better Auth)
4. External docs

Never skip local code inspection and jump directly to generic framework memory.

## Runtime/Dev Commands (intentional flow control)

- Use `pnpm` 10.29.3 (root `packageManager`) and Node `>=20`.
- `pnpm dev` starts DB+backend in Docker and frontends locally.
  - Do not run `pnpm dev` at the same time (backend would be double-started).
- `pnpm run dev:frontend` starts only web/dashboard/admin/cms and wraps Turbo
  with `infisical run` when local Infisical auth is available.
- `pnpm run dev:frontend:no-infisical` starts only frontends from local
  shell/Next `.env` values.
- `pnpm run dev:backend` starts only local DB+backend Docker without rebuilding.
- `pnpm run dev:backend:restart` restarts only the Docker backend and waits for
  `http://localhost:3003/` to become healthy. Use this for most backend
  validation; it should not restart frontends.
- `pnpm run dev:backend:rebuild` rebuilds/recreates the backend container. Use
  it only after Dockerfile/dependency/lockfile changes.
- `pnpm run dev:stop` aggressively clears Docker + ports `3000-3004`.
- `pnpm dev` must not start ngrok automatically; use `pnpm run tunnel:backend`
  manually in a separate terminal when a backend tunnel is needed.
- If a shell resolves the wrong pnpm version, use `corepack pnpm <command>` or
  activate the workspace version with `corepack prepare pnpm@10.29.3 --activate`.

## Frontend API Base URL Resolution

- `NEXT_PUBLIC_API_URL` is injected from app `next.config.mjs` files, reading
  Infisical-provided `process.env` first and then local Next env/fallbacks.
  - `apps/web/next.config.mjs`
  - `apps/dashboard/next.config.mjs`
  - `apps/admin/next.config.mjs`
- Dev fallback defaults to `http://localhost:3003`.
- `turbo.json` exposes `NEXT_PUBLIC_API_URL` via `globalEnv`; after Infisical
  or `.env` changes, restart dev servers.

## API Client Usage (do not bypass wrappers)

- Browser/client components: use `clientApi()` from `@workspace/api/client`.
- Next server components/route handlers: use `serverApi()` from `@workspace/api/server` (it forwards cookies from `next/headers`).
- Shared behavior: `fetcher()` from `@workspace/api/fetcher`:
  - serializes non-FormData non-string non-URLSearchParams bodies as JSON
  - auto-sends `{}` for `POST/PUT/PATCH` with null/undefined body
  - always sets `credentials: "include"`

Avoid ad-hoc `fetch` unless there is a strong reason.

## CORS + Webhooks (easy to break)

- Backend has CORS plus an extra mutating-method origin guard in `apps/backend/src/index.ts`.
  - Misconfigured `CORS_ALLOWED_ORIGINS` can produce `403 Forbidden origin` even when CORS plugin is enabled.
- Webhook signature verification depends on exact raw body:
  - `fastify-raw-body` is registered with `runFirst: true` in `apps/backend/src/index.ts`
  - `apps/backend/src/routes/webhook.ts` relies on `request.rawBody` for Dodo/CoinGate verification.
  - Do not refactor this into parsed-body-only verification.

## Auth/Session Conventions

- Better Auth (`/api/auth/*`) is the primary auth path.
- Route handlers that require auth use `verifyAuth` middleware (`apps/backend/src/middleware/auth.ts`) which reads Better Auth session and normalizes user role/email.
- Keep compatibility assumptions around session cookies and trusted origins.

## OpenAPI Contract Flow

- After backend route changes, regenerate spec:
  - `pnpm --filter backend openapi:export`
- `openapi.json` at repo root is expected to reflect current routes for Postman/API consumers.

## Lint/Format/Types

- ESLint config uses `only-warn` and `turbo/no-undeclared-env-vars`.
- Prettier rules:
  - no semicolons
  - double quotes
  - print width 80
  - Tailwind class ordering based on `packages/ui/src/styles/globals.css`
  - recognized Tailwind helper functions: `cn`, `cva`
- TypeScript is strict with `noUncheckedIndexedAccess` and `moduleDetection: "force"` (from shared config).

## Routing + Path Helpers

- `typedRoutes` is enabled in:
  - `apps/dashboard/next.config.mjs`
  - `apps/admin/next.config.mjs`
- Route helper maps are in:
  - `apps/dashboard/lib/paths.ts`
  - `apps/web/lib/paths.ts`
  - `apps/admin/lib/paths.ts`
- Prefer updating these helpers instead of scattering inline route strings.

## Monorepo Package Boundaries

- Next apps transpile `@workspace/ui` and `@workspace/api`.
- Import through package exports (`@workspace/ui/*`, `@workspace/api/*`), not deep relative cross-package paths.

## Testing

- No formal test runner is configured yet in root/app scripts.
- For validation, rely on targeted typecheck/lint/build and focused manual/API checks until a test framework is introduced.
