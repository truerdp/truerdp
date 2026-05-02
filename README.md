# Truerdp Monorepo

Truerdp is a `pnpm` + Turborepo monorepo with:

- three Next.js applications: `web`, `dashboard`, `admin`
- one Fastify backend: `backend`
- shared packages for UI, ESLint config, and TypeScript config

This root README focuses on the current working development setup.
Detailed product, domain, lifecycle, backend, and operations notes are maintained in the repo markdown files.

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
|-- RAZORPAY_WEBHOOKS.md
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

3. Create backend env file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

4. Start all workspaces:

```bash
pnpm dev
```

## Daily Startup

After rebooting your machine, use one of these startup flows:

### DB + backend in Docker, frontend locally

```bash
pnpm run dev:docker
```

Equivalent expanded form:

```bash
docker compose -f docker-compose.yml up -d --force-recreate backend db
pnpm run dev:frontend
```

`pnpm dev` starts backend too, so avoid running it together with `docker compose -f docker-compose.yml up -d` unless you intentionally stop one backend instance.

If you change backend routes or server-only code and want to refresh only the
Docker backend without touching the frontends, use:

```bash
pnpm run dev:backend:restart
```

### VS Code split-terminal startup

If you want Docker and frontend dev in separate terminals with one action, run the VS Code task:

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

1. Create a backend env file on the server (for example `apps/backend/.env.production.local`) with production values.
   A template is available at `apps/backend/.env.production.example`.
2. Create a root `.env` file for Docker Compose interpolation. For an external
   managed database such as Neon, include:

```env
POSTGRES_PASSWORD=not-used-with-neon
DATABASE_URL="postgresql://..."
BACKEND_ENV_FILE=apps/backend/.env.production.local
BACKEND_PORT=3003
BACKEND_BIND_HOST=127.0.0.1
```

3. Start the backend:

```bash
pnpm run docker:prod:up:backend
```

If running Postgres inside Compose instead of Neon, set real `POSTGRES_*`
values and start the full stack:

```bash
pnpm run docker:prod:up
```

4. Stop the stack:

```bash
pnpm run docker:prod:down
```

Notes:

- The production stack builds with `apps/backend/Dockerfile.prod`.
- It does not use bind mounts and runs `node dist/index.js`.
- For external managed databases (Neon/RDS/etc), set `DATABASE_URL` in your backend env file and use `pnpm run docker:prod:up:backend`.
- Backend binds to `127.0.0.1:3003` by default in production compose; front it with Nginx and TLS as described in `deploy/docker-prod.md`.

Local URLs:

- Web: `http://localhost:3000`
- Dashboard: `http://localhost:3001`
- Admin: `http://localhost:3002`
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
RESOURCE_CREDENTIALS_SECRET=change-this-too
RESEND_API_KEY=
RESEND_FROM_EMAIL="TrueRDP <onboarding@resend.dev>"
RESEND_REPLY_TO_EMAIL=
RESEND_BASE_URL=
DASHBOARD_BASE_URL=http://localhost:3001
COINGATE_ENVIRONMENT=sandbox
COINGATE_API_TOKEN=
COINGATE_RECEIVE_CURRENCY=DO_NOT_CONVERT
BACKEND_BASE_URL=http://localhost:3003
```

Web CMS env values (set in `apps/web/.env` for dev, or
`apps/web/.env.production.local` for local production runs):

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_VERSION=2026-03-01
SANITY_API_TOKEN=
SANITY_BROWSER_TOKEN=
SANITY_DRAFT_SECRET=
SANITY_REVALIDATE_SECRET=
```

Sanity routes used by `apps/web`:

- Studio: `http://localhost:3000/studio`
- Draft mode enable: `/api/draft?secret=...&slug=/target-path`
- Draft mode disable: `/api/draft/disable?slug=/target-path`
- Revalidation webhook: `POST /api/revalidate` (signed with `SANITY_REVALIDATE_SECRET`)

## Commands

Root commands:

```bash
pnpm dev
pnpm run dev:frontend
pnpm run dev:docker
pnpm run dev:backend:restart
pnpm run dev:stop
pnpm run docker:local:up
pnpm run docker:local:down
pnpm run docker:prod:up
pnpm run docker:prod:up:backend
pnpm run docker:prod:down
pnpm run docker:prod:logs
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
pnpm --filter web sanity:studio
pnpm --filter web sanity:deploy
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

Vercel and Railway can auto-deploy from `main`, but database migrations still
need an explicit production step. The GitHub Actions workflow in
`.github/workflows/migrate.yml` runs `pnpm --filter backend db:migrate` on every
push to `main` and can also be triggered manually.

Required GitHub secret:

```bash
PRODUCTION_DATABASE_URL="postgres://..."
```

Use the same production database connection string that Railway/backend uses.
The workflow has a single concurrency group so production migrations run one at
a time.

If the Railway backend service auto-deploys directly from GitHub, also set the
Railway service pre-deploy command to:

```bash
pnpm --filter backend db:migrate
```

Railway runs pre-deploy commands after build and before deployment, and a
failing command stops that deployment. This gives the backend strict
migrate-before-start ordering. See Railway's
[pre-deploy command docs](https://docs.railway.com/guides/pre-deploy-command).

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
