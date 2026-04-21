# Truerdp Monorepo

Truerdp is a `pnpm` + Turborepo monorepo with:

- three Next.js applications: `web`, `dashboard`, `admin`
- one Fastify backend: `backend`
- shared packages for UI, ESLint config, and TypeScript config

This root README focuses on the current working development setup.
Detailed product, domain, lifecycle, backend, and operations notes are maintained in the repo markdown files.

## Current Status

Current implementation highlights:

- `apps/backend` exposes authentication, billing, instance, and admin APIs
- billing follows `user -> order -> invoice -> transaction -> instance`
- `apps/dashboard` includes an authenticated dashboard with instance listing, instance details, renewal flow, and invoice-backed transaction history
- `apps/web` now includes a server-rendered marketing homepage for SEO, with server-side plan fetching and metadata; checkout interactions remain client-side
- `apps/admin` includes functional operations screens (instances, plans, invoices, transactions, servers) and is still evolving toward full product parity

## Repository Layout

```text
truerdp/
|-- .agents/
|-- .continue/
|-- .dockerignore
|-- .env
|-- .env.example
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
docker compose up -d
pnpm run dev:frontend
```

`pnpm dev` starts backend too, so avoid running it together with `docker compose up -d` unless you intentionally stop one backend instance.

### VS Code split-terminal startup

If you want Docker and frontend dev in separate terminals with one action, run the VS Code task:

- `dev: docker + frontend (split terminals)`

This task is defined in `.vscode/tasks.json` and starts:

- `docker compose up -d` in a dedicated Docker terminal
- `pnpm run dev:frontend` in a dedicated frontend terminal

Local URLs:

- Web: `http://localhost:3000`
- Dashboard: `http://localhost:3001`
- Admin: `http://localhost:3002`
- Backend: `http://localhost:3003`

## Environment Variables

Backend env values (`apps/backend/.env.example`):

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/truerdp"
PORT=3003
JWT_SECRET=change-this-in-production
RESOURCE_CREDENTIALS_SECRET=change-this-too
```

## Commands

Root commands:

```bash
pnpm dev
pnpm run dev:frontend
pnpm run dev:docker
pnpm run dev:stop
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
- Plan: `Starter RDP`
- Pricing options: `30 days / 500`, `90 days / 1299`
