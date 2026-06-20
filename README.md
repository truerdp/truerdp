# Truerdp Monorepo

Truerdp is a `pnpm` + Turborepo monorepo with:

- four Next.js applications: `web`, `dashboard`, `admin`, `cms`
- one Fastify backend: `backend`
- shared packages for UI, ESLint config, and TypeScript config

This root README focuses on the current working development setup. Detailed
product, domain, lifecycle, backend, and operations notes are maintained in the
repo markdown files.

## Default Workflow

Use these commands for the normal path:

```bash
pnpm dev
pnpm run dev:stop
pnpm run doctor
pnpm run prod:backend
pnpm run prod:backend:refresh
```

- `pnpm dev` starts local Postgres/backend in Docker and all frontend apps
  locally (`web`, `dashboard`, `admin`, and `cms`). It also starts an ngrok
  tunnel for the backend on port `3003` when ngrok is installed. If Infisical
  is configured in the shell, it syncs backend secrets and injects frontend
  secrets from Infisical; otherwise it uses local `.env` files and creates
  `apps/backend/.env` from the example when missing.
- `pnpm run prod:backend` renders backend production secrets from Infisical and
  starts/rebuilds the production backend container.
- `pnpm run prod:backend:refresh` re-renders backend production secrets and
  recreates the backend container without rebuilding.
- Pushes to `main` deploy the backend through GitHub Actions and use the same
  `pnpm run prod:backend` command on the DigitalOcean host.

## Current Status

Current implementation highlights-to-date:

- `apps/backend` exposes authentication, catalog, billing, instance, order, webhook, and admin APIs
- billing follows `user -> order -> invoice -> transaction -> instance`, with renewal orders reusing the same lifecycle primitives
- `apps/dashboard` includes authenticated user views for instances, instance details, renewals, invoices, and transaction history
- `apps/web` includes the public marketing homepage, signup/login screens, plan browsing, checkout review, and checkout success pages
- `apps/admin` includes operational screens for users, plans, instances, expired instances, servers, invoices, and transactions

Current business behavior in the codebase:

- new purchases create an order, invoice, and pending transaction before provisioning starts
- payment confirmation can arrive from the admin panel or from payment webhooks
- provisioning is manual and assigns an available server to an instance, then activates the instance and stores credentials on the resource binding
- renewals extend the existing instance instead of creating a new server allocation
- termination releases the resource, moves the server into cleaning, and marks the instance terminated

## Repository Layout

```text
truerdp/
|-- .agents/
|-- .continue/
|-- .dockerignore
|-- .eslintrc.js
|-- .gitignore
|-- .npmrc
|-- .postman/
|-- .prettierignore
|-- .prettierrc
|-- .vscode/
|-- about.md
|-- BUSINESS_FLOW.md
|-- apps/
|   |-- admin/
|   |-- backend/
|   |-- dashboard/
|   `-- web/
|-- docker-compose.yml
|-- docker-compose.prod.yml
|-- ENHANCEMENT.md
|-- FRONTEND_DEVELOPMENT.md
|-- package.json
|-- packages/
|   |-- api/
|   |-- eslint-config/
|   |-- typescript-config/
|   `-- ui/
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
|-- postman/
|-- progress.md
|-- skills/
|-- skills-lock.json
|-- tsconfig.json
|-- turbo.json
```

Workspace members are defined in `pnpm-workspace.yaml`:

- `apps/*`
- `packages/*`

Key runtime folders:

- `apps/web/app`: public site, auth, and checkout routes
- `apps/dashboard/app`: authenticated customer dashboard routes
- `apps/admin/app`: admin operations routes
- `apps/backend/src/routes`: HTTP route modules for auth, users, plans, orders, transactions, instances, admin, and webhooks
- `apps/backend/src/services`: billing, provisioning, allocation, plan, payment webhook, and provider integration logic
- `apps/backend/src/schema.ts`: Drizzle schema and enums for users, plans, pricing, orders, invoices, transactions, instances, servers, and resources
- `packages/api`: shared API client wrappers
- `packages/ui`: shared UI components and primitives
- `packages/eslint-config` and `packages/typescript-config`: workspace-wide tooling standards

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Use Node.js `20+` and the workspace `pnpm` version from `packageManager`:

```bash
node -v
pnpm -v
```

3. Configure local environment values:

If Infisical is configured for this checkout, `pnpm dev` syncs the backend env
and injects frontend env automatically. For an offline fallback, create the
backend `.env` file from the example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

4. Start the local development stack:

```bash
pnpm dev
```

## Daily Startup

After rebooting your machine, start everything with:

```bash
pnpm dev
```

That command uses Infisical when available. It renders `apps/backend/.env` for
Docker and starts the frontend apps through `infisical run`, so the Next.js apps
receive frontend variables from Infisical without app-level `.env` files. When
Infisical is not available, it falls back to local `.env` files. It also starts
`ngrok http 3003` automatically when ngrok is available. To skip the tunnel for
one run:

```bash
TRUERDP_SKIP_TUNNEL=true pnpm dev
```

PowerShell:

```powershell
$env:TRUERDP_SKIP_TUNNEL = "true"; pnpm dev
```

Equivalent expanded fallback form:

```bash
docker compose -f docker-compose.yml up -d --force-recreate backend db
pnpm run dev:frontend:no-infisical
```

Use `pnpm run dev:frontend` when you want only the frontend apps; it also wraps
Turbo with Infisical when local auth is available.

Avoid running raw `turbo dev` with
`docker compose -f docker-compose.yml up -d backend` unless you intentionally
stop one backend instance.

If you change backend routes or server-only code and want to refresh only the
Docker backend without touching the frontends, use:

```bash
pnpm run dev:backend:restart
```

### VS Code Startup

The simplest VS Code task is:

- `dev: app`

If you want Docker and frontend dev in separate terminals with one action, use:

- `dev: docker + frontend (split terminals)`

This task is defined in `.vscode/tasks.json` and starts:

- `docker compose -f docker-compose.yml up -d db backend` in a dedicated Docker terminal
- `pnpm run dev:frontend` in a dedicated frontend terminal

### Production Docker (VPS)

Use `docker-compose.prod.yml` for production-like runs on a VPS.

Detailed step-by-step VPS guide:

- `deploy/docker-prod.md`
- Future DigitalOcean-to-Hetzner migration runbook:
  `deploy/hetzner-migration.md`
- Backend deploy workflow: `.github/workflows/deploy-backend.yml`

1. Store production app secrets in Infisical. See `deploy/infisical/README.md`
   for the project/folder layout, Vercel syncs, and DigitalOcean backend agent.
2. Create a root `.env` file for Docker Compose interpolation. For an external
   managed database such as Neon, include:

```env
POSTGRES_PASSWORD=not-used-with-neon
DATABASE_URL="postgresql://..."
BACKEND_ENV_FILE=apps/backend/.env.production.infisical
BACKEND_PORT=3003
BACKEND_BIND_HOST=127.0.0.1
```

3. Render backend secrets from Infisical and start the backend:

```bash
pnpm run prod:backend
```

If running Postgres inside Compose instead of Neon, set real `POSTGRES_*`
values and start the full stack directly:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4. Stop the stack:

```bash
pnpm run prod:down
```

Notes:

- The production stack builds with `apps/backend/Dockerfile.prod`.
- It does not use bind mounts and runs `node dist/index.js`.
- For external managed databases (Neon/RDS/etc), set `DATABASE_URL` in
  Infisical and use `pnpm run prod:backend`.
- Backend binds to `127.0.0.1:3003` by default in production compose; front it
  with Caddy and Cloudflare Full (strict) TLS as described in
  `deploy/docker-prod.md`.
- Pushes to `main` that touch backend-related files deploy through GitHub
  Actions after typecheck, build, migrations, and remote
  `pnpm run prod:backend`. Required secrets are documented in
  `deploy/docker-prod.md`.

Local URLs:

- Web: `http://localhost:3000`
- Dashboard: `http://localhost:3001`
- Admin: `http://localhost:3002`
- CMS: `http://localhost:3004`
- Backend: `http://localhost:3003`

## Business Flows

The current codebase implements a manual billing-to-provisioning lifecycle.

### Public customer flow

- visitors land on `apps/web` to browse plans and reach auth or checkout entry points
- signup and login create an authenticated session backed by a cookie or bearer token
- the web checkout flow creates the commercial order and captures billing details before payment confirmation

### Purchase and billing flow

- `/orders` creates the order record for a selected plan pricing option
- `/transactions` creates the payment attempt tied to the order and invoice
- `/invoices` exposes invoice state for the signed-in user
- payment confirmation can come from the admin UI or from `/webhooks/payments/:provider`

### Provisioning flow

- once payment is confirmed, the order moves into provisioning-related handling
- an admin operator picks an available server from `/admin/servers`
- provisioning creates a resource binding between instance and server, stores credentials on the resource, and marks the instance active
- the instance details visible in dashboard and admin come from the instance/resource/server join path in the backend

### Renewal and termination flow

- renewals are created from an existing instance and extend the current service period instead of allocating a new server
- expired instances surface in admin so operators can extend or terminate them
- termination releases the resource, moves the server to cleaning, and marks the instance terminated

## Environment Variables

Backend env values (`apps/backend/.env.example`):

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/truerdp"
PORT=3003
JWT_SECRET=change-this-in-production
BETTER_AUTH_SECRET=change-this-in-production
BETTER_AUTH_URL=http://localhost:3003
RESOURCE_CREDENTIALS_SECRET=change-this-too
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
RESEND_API_KEY=
RESEND_FROM_EMAIL="TrueRDP <support@truerdp.com>"
RESEND_REPLY_TO_EMAIL="TrueRDP <support@truerdp.com>"
DASHBOARD_BASE_URL=http://localhost:3001
COINGATE_ENVIRONMENT=sandbox
COINGATE_API_TOKEN=
COINGATE_RECEIVE_CURRENCY=DO_NOT_CONVERT
BACKEND_BASE_URL=http://localhost:3003
EXPIRY_REMINDER_SWEEP_INTERVAL_MINUTES=0
EXPIRY_REMINDER_SWEEP_DAYS_AHEAD=3
```

Notes:

- Better Auth (`/api/auth/*`) is now the primary auth path used by the web app.
- Keep `BETTER_AUTH_*` and `CORS_ALLOWED_ORIGINS` aligned across web/dashboard/admin origins.

Payload CMS env values (set in `apps/cms/.env` and shared app env as needed):

```env
PAYLOAD_SECRET=change-this-in-production
PAYLOAD_PUBLIC_URL=http://localhost:3004
CMS_INTERNAL_API_URL=http://localhost:3004
CMS_INTERNAL_API_TOKEN=change-this-cms-internal-token
CMS_REVALIDATE_SECRET=change-this-revalidate-secret
WEB_BASE_URL=http://localhost:3000
```

Payload routes used by the apps:

- Admin: `http://localhost:3004/admin`
- Public API: `http://localhost:3004/api/*`
- Web draft mode enable: `/api/draft?secret=...&slug=/target-path`
- Web draft mode disable: `/api/draft/disable?slug=/target-path`
- Web revalidation webhook: `POST /api/revalidate` signed with `CMS_REVALIDATE_SECRET`

## Commands

Root commands:

```bash
pnpm dev
pnpm run dev:frontend
pnpm run dev:backend:restart
pnpm run dev:stop
pnpm run doctor
pnpm run prod:backend
pnpm run prod:backend:refresh
pnpm run prod:down
pnpm run prod:logs
pnpm run tunnel:backend
pnpm build
pnpm lint
pnpm format
pnpm typecheck
```

Run a specific app/package:

```bash
pnpm --filter web dev
pnpm --filter dashboard dev
pnpm --filter admin dev
pnpm --filter backend dev
pnpm --filter cms dev
pnpm --filter cms payload
```

Backend database workflows:

```bash
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
pnpm --filter backend db:push
pnpm --filter backend db:seed
pnpm --filter backend db:studio
```

For billing and transaction work, make sure the backend migrations are current before retrying a failed checkout flow. The transaction path depends on the latest `orders`, `invoices`, and `transactions` schema.

If you are updating payment or provisioning behavior, also review `BUSINESS_FLOW.md` and `architecture.md` because they describe the current lifecycle and runtime boundaries in more detail.

## CI/CD Migrations

Vercel and the backend deploy workflow can auto-deploy from `main`, but
database migrations still need an explicit production step. The GitHub Actions workflow in
`.github/workflows/migrate.yml` runs `pnpm --filter backend db:migrate` on every
push to `main` and can also be triggered manually.

Required GitHub secret:

```bash
PRODUCTION_DATABASE_URL="postgres://..."
```

Use the same production database connection string that Infisical provides to
the backend.
The workflow has a single concurrency group so production migrations run one at
a time.

## Local DB Reset

When the schema baseline changes and you intentionally want a clean local database:

```bash
psql postgresql://postgres:postgres@localhost:5432/truerdp -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA drizzle;"
pnpm --filter backend db:migrate
pnpm --filter backend db:seed
```

Seeded local credentials:

- Admin: `admin@truerdp.local` / `password123`
- User: `user@truerdp.local` / `password123`
- Plans: `Starter RDP`, `Business RDP`, `Performance RDP`,
  `Residential Basic`, `Residential Pro`
- Pricing options: monthly and multi-month options, plus weekly residential
  options where available

## Neon DB Reset

To wipe the Neon database configured for production:

```bash
pnpm --filter backend db:reset -- --yes
```

If you want to preview the tables first, run:

```bash
pnpm --filter backend db:reset -- --dry-run
```

This truncates every `public` table except `__drizzle_migrations` and resets
identities with `CASCADE`.
