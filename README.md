# Truerdp Monorepo

Truerdp is a `pnpm` + Turborepo monorepo with:

- three Next.js applications: `web`, `dashboard`, `admin`
- one Fastify backend: `backend`
- shared packages for UI, ESLint config, and TypeScript config

This root README is intentionally concise.
Detailed product, domain, lifecycle, backend, and operations rules are maintained in `docs/`.

## Documentation

Start here:

- [docs/README.md](docs/README.md)

Complete documentation set:

1. [Architecture](docs/01_ARCHITECTURE.md)
2. [Domain Model](docs/02_DOMAIN_MODEL.md)
3. [Lifecycle](docs/03_LIFECYCLE.md)
4. [Authentication and Authorization](docs/04_AUTH.md)
5. [State Rules](docs/05_STATE_RULES.md)
6. [Backend Contract](docs/06_BACKEND_CONTRACT.md)
7. [Database Schema](docs/07_DATABASE_SCHEMA.md)
8. [Product Rules](docs/08_PRODUCT_RULES.md)
9. [Payments](docs/09_PAYMENTS.md)
10. [Admin Workflow](docs/10_ADMIN_WORKFLOW.md)
11. [Backend Structure](docs/11_BACKEND_STRUCTURE.md)
12. [AI Context](docs/12_AI_CONTEXT.md)
13. [Support](docs/13_SUPPORT.md)
14. [DevOps](docs/14_DEVOPS.md)
15. [Frontend Development](docs/15_FRONTEND_DEVELOPMENT.md)

## Repository Layout

```text
truerdp/
|-- apps/
|   |-- admin/
|   |-- backend/
|   |-- dashboard/
|   `-- web/
|-- docs/
|-- packages/
|   |-- eslint-config/
|   |-- typescript-config/
|   `-- ui/
|-- package.json
|-- pnpm-workspace.yaml
|-- turbo.json
`-- tsconfig.json
```

Workspace members are defined in `pnpm-workspace.yaml`:

- `apps/*`
- `packages/*`

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Create backend env file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

3. Start all workspaces:

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
```

## Commands

Root commands:

```bash
pnpm dev
pnpm run dev:frontend
pnpm run dev:docker
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
pnpm --filter backend db:studio
```
