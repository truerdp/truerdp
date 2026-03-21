# Truerdp Monorepo

Truerdp is a `pnpm` + Turborepo monorepo that currently contains three Next.js applications, one Fastify backend, and a shared UI/config layer for keeping the workspace consistent.

The repo is already set up for:

- multi-app frontend development
- a PostgreSQL-backed API using Drizzle ORM
- shared TypeScript and ESLint configuration
- shared UI components exported from a local package
- workspace-wide build, lint, format, and typecheck workflows

At the moment, the frontend apps are still close to starter scaffolds and the backend has only a minimal health route enabled. This README documents the repo as it exists today so the next development steps are clear.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Applications](#applications)
- [Shared Packages](#shared-packages)
- [How the Monorepo Works](#how-the-monorepo-works)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Commands](#development-commands)
- [Backend and Database Notes](#backend-and-database-notes)
- [Frontend Notes](#frontend-notes)
- [Shared UI Notes](#shared-ui-notes)
- [Linting, Formatting, and Type Safety](#linting-formatting-and-type-safety)
- [Current Project Status](#current-project-status)
- [Known Gaps and Gotchas](#known-gaps-and-gotchas)
- [Suggested Next Steps](#suggested-next-steps)

## Tech Stack

### Workspace tooling

- `pnpm@10.29.3` for package management
- Turborepo for task orchestration and caching
- TypeScript `5.9.x`
- Prettier with `prettier-plugin-tailwindcss`
- shared ESLint and TypeScript config packages under `packages/*`

### Frontend

- Next.js `16.1.6`
- React `19.2.x`
- App Router
- Tailwind CSS v4 via `@tailwindcss/postcss`
- `next-themes` for theme switching
- shared components from `@workspace/ui`
- UI-related libraries already installed in the app layer and/or shared package:
  - `@base-ui/react`
  - `cmdk`
  - `embla-carousel-react`
  - `input-otp`
  - `react-day-picker`
  - `react-resizable-panels`
  - `recharts`
  - `sonner`
  - `vaul`
  - `@hugeicons/react`

### Backend

- Fastify `5.8.x`
- `@fastify/cors`
- Drizzle ORM
- Drizzle Kit
- PostgreSQL drivers:
  - `postgres`
  - `pg`
- `dotenv`
- `zod`
- `tsx` for local dev watch mode

## Repository Layout

```text
truerdp/
|-- apps/
|   |-- admin/        # Next.js admin app
|   |-- backend/      # Fastify API + Drizzle ORM
|   |-- dashboard/    # Next.js dashboard app
|   `-- web/          # Next.js public-facing app
|-- packages/
|   |-- eslint-config/      # Shared ESLint presets
|   |-- typescript-config/  # Shared TS configs
|   `-- ui/                 # Shared UI package
|-- package.json
|-- pnpm-workspace.yaml
|-- turbo.json
`-- tsconfig.json
```

### Workspace discovery

The workspace is defined by `pnpm-workspace.yaml`:

- `apps/*`
- `packages/*`

That means each app/package is its own workspace member and can be targeted independently with `pnpm --filter <name> ...`.

## Applications

### `apps/web`

Purpose:

- intended to be the main public-facing web app

Current state:

- uses Next.js App Router
- runs on port `3000`
- still renders the default starter page
- imports shared global styles from `@workspace/ui`
- includes a local theme provider with keyboard theme toggle support

Notable files:

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/theme-provider.tsx`
- `apps/web/components.json`

Scripts:

- `pnpm --filter web dev`
- `pnpm --filter web build`
- `pnpm --filter web start`
- `pnpm --filter web lint`
- `pnpm --filter web format`
- `pnpm --filter web typecheck`

### `apps/dashboard`

Purpose:

- intended to be an internal dashboard frontend

Current state:

- uses the same base setup as `web`
- runs on port `3001`
- currently renders the same starter page as the other Next apps
- shares styling, fonts, and theme behavior with the other frontend apps

Notable files:

- `apps/dashboard/app/layout.tsx`
- `apps/dashboard/app/page.tsx`
- `apps/dashboard/app/globals.css`
- `apps/dashboard/components/theme-provider.tsx`
- `apps/dashboard/components.json`

Scripts:

- `pnpm --filter dashboard dev`
- `pnpm --filter dashboard build`
- `pnpm --filter dashboard start`
- `pnpm --filter dashboard lint`
- `pnpm --filter dashboard format`
- `pnpm --filter dashboard typecheck`

### `apps/admin`

Purpose:

- intended to be an admin-facing frontend

Current state:

- also uses the same base setup as `web` and `dashboard`
- runs on port `3002`
- currently renders the same starter page as the other two frontend apps
- ready to consume components from the shared UI package

Notable files:

- `apps/admin/app/layout.tsx`
- `apps/admin/app/page.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/components/theme-provider.tsx`
- `apps/admin/components.json`

Scripts:

- `pnpm --filter admin dev`
- `pnpm --filter admin build`
- `pnpm --filter admin start`
- `pnpm --filter admin lint`
- `pnpm --filter admin format`
- `pnpm --filter admin typecheck`

### `apps/backend`

Purpose:

- Fastify API server
- PostgreSQL access through Drizzle ORM

Current state:

- loads environment variables with `dotenv/config`
- enables CORS for all origins
- exposes a health route at `GET /`
- contains a `users` Drizzle schema
- includes Drizzle Kit configuration for schema generation/migration workflows
- has a commented-out `/users` route and commented-out DB import, so the database layer is not yet active in runtime routes

Default runtime behavior:

- listens on `process.env.PORT` when provided
- otherwise defaults to port `3003`

Notable files:

- `apps/backend/src/index.ts`
- `apps/backend/src/db.ts`
- `apps/backend/src/schema.ts`
- `apps/backend/drizzle.config.ts`
- `apps/backend/.env.example`

Scripts:

- `pnpm --filter backend dev`
- `pnpm --filter backend build`
- `pnpm --filter backend start`
- `pnpm --filter backend lint`
- `pnpm --filter backend typecheck`
- `pnpm --filter backend db:generate`
- `pnpm --filter backend db:migrate`
- `pnpm --filter backend db:push`
- `pnpm --filter backend db:studio`

## Shared Packages

### `packages/ui`

This is the shared UI package used by the frontend apps.

It currently provides:

- shared global CSS
- utility helpers such as `cn`
- a large exported component surface under `src/components/*`
- export aliases for `components`, `lib`, `hooks`, and `globals.css`
- a shadcn-style configuration with `base-vega`, `neutral` base color, CSS variables, and Hugeicons

Representative components already available:

- button
- card
- dialog
- drawer
- dropdown-menu
- input
- select
- table
- tabs
- tooltip
- sidebar
- sonner
- chart
- calendar

Exports configured in `packages/ui/package.json`:

- `@workspace/ui/globals.css`
- `@workspace/ui/postcss.config`
- `@workspace/ui/lib/*`
- `@workspace/ui/components/*`
- `@workspace/ui/hooks/*`

Notes:

- frontend apps import shared styles from `@workspace/ui/globals.css`
- frontend apps also point their `components.json` aliases at `@workspace/ui/components` and `@workspace/ui/lib/utils`
- `packages/ui/src/lib/utils.ts` exports the common `cn(...)` helper based on `clsx` and `tailwind-merge`

### `packages/eslint-config`

Shared ESLint configuration package for the workspace.

Purpose:

- centralize lint rules across apps and packages

Files:

- `packages/eslint-config/base.js`
- `packages/eslint-config/next.js`
- `packages/eslint-config/react-internal.js`

### `packages/typescript-config`

Shared TypeScript configuration package for the workspace.

Purpose:

- keep TS compiler settings consistent across the monorepo

Files:

- `packages/typescript-config/base.json`
- `packages/typescript-config/nextjs.json`
- `packages/typescript-config/react-library.json`

The root `tsconfig.json` extends `@workspace/typescript-config/base.json`.

## How the Monorepo Works

### Root scripts

From the repository root:

- `pnpm dev` runs `turbo dev`
- `pnpm build` runs `turbo build`
- `pnpm lint` runs `turbo lint`
- `pnpm format` runs `turbo format`
- `pnpm typecheck` runs `turbo typecheck`

### Turbo pipeline

The `turbo.json` pipeline is configured so that:

- `build` depends on upstream package builds
- `build` uses `.env*` files as inputs
- `build` caches outputs from `.next/**` and `dist/**`
- `lint`, `format`, and `typecheck` depend on the same task in upstream packages
- `dev` is persistent and not cached

This lets the repo behave like a coordinated multi-package workspace instead of isolated apps.

## Prerequisites

Install the following before working in the repo:

- Node.js `20+`
- `pnpm` `10+`
- PostgreSQL if you want to run the backend with a real database

To confirm versions:

```bash
node -v
pnpm -v
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create backend environment variables

The backend includes an example file:

```bash
apps/backend/.env.example
```

Create a real env file from it:

```bash
cp apps/backend/.env.example apps/backend/.env
```

If you are on PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

### 3. Update the backend port

The checked-in example currently uses:

```env
PORT=3003
```

### 4. Start the workspace

Run everything in parallel:

```bash
pnpm dev
```

Or run workspaces individually:

```bash
pnpm --filter web dev
pnpm --filter dashboard dev
pnpm --filter admin dev
pnpm --filter backend dev
```

### Expected local URLs

- Web: `http://localhost:3000`
- Dashboard: `http://localhost:3001`
- Admin: `http://localhost:3002`
- Backend: `http://localhost:3003`

## Environment Variables

### Backend

Documented in `apps/backend/.env.example`:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/truerdp"
PORT=3003
```

What each variable does:

- `DATABASE_URL`: required by Drizzle and the `postgres` client
- `PORT`: optional server port override for Fastify

Important runtime behavior:

- `apps/backend/src/db.ts` throws immediately if `DATABASE_URL` is not set
- the current `src/index.ts` does not import the DB module at runtime because the DB import is commented out
- Drizzle commands still expect `DATABASE_URL` because `drizzle.config.ts` reads it

### Frontend apps

No frontend-specific `.env` files were found in the repository during inspection.

That means:

- the frontend apps can boot with the current scaffold without extra env setup
- once API URLs, auth secrets, or analytics keys are introduced, this section should be expanded

## Development Commands

### Root commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck
```

### Workspace-specific commands

### Web

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web start
pnpm --filter web lint
pnpm --filter web format
pnpm --filter web typecheck
```

### Dashboard

```bash
pnpm --filter dashboard dev
pnpm --filter dashboard build
pnpm --filter dashboard start
pnpm --filter dashboard lint
pnpm --filter dashboard format
pnpm --filter dashboard typecheck
```

### Admin

```bash
pnpm --filter admin dev
pnpm --filter admin build
pnpm --filter admin start
pnpm --filter admin lint
pnpm --filter admin format
pnpm --filter admin typecheck
```

### Backend

```bash
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend start
pnpm --filter backend lint
pnpm --filter backend typecheck
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
pnpm --filter backend db:push
pnpm --filter backend db:studio
```

## Backend and Database Notes

### Fastify server

The backend currently does the following:

- creates a Fastify server with logging enabled
- registers CORS with `origin: "*"`
- exposes `GET /` returning:

```json
{ "status": "ok", "message": "Truerdp API is running" }
```

- binds to `0.0.0.0`

### Drizzle ORM

The current schema defines one table:

- `users`
  - `id`: serial primary key
  - `name`: text, required
  - `email`: text, required, unique
  - `created_at`: timestamp, defaults to now, required

### Database wiring status

What is already present:

- schema file
- DB client setup
- Drizzle config
- migration/generation scripts

What is not yet active:

- the DB import in `src/index.ts`
- the `/users` route in `src/index.ts`
- any validation, auth, or domain logic beyond the starter health check

### Database workflow expectations

Once the backend is actively using the DB, the intended flow appears to be:

1. edit `apps/backend/src/schema.ts`
2. run `pnpm --filter backend db:generate` or `db:push`
3. apply or inspect schema changes
4. use the schema in route handlers via Drizzle

## Frontend Notes

### Shared frontend baseline

All three Next apps currently share the same core structure:

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/theme-provider.tsx`
- `hooks/use-mobile.ts`
- `components.json`

### Fonts and styling

The layouts currently use:

- `Roboto` for sans
- `Roboto Slab` for slab
- `Geist Mono` for mono

The layout imports:

- `@workspace/ui/globals.css`
- app-local `./globals.css`

This means global tokens and component styles are centralized in the UI package while each app can still layer app-specific styles.

### Theme behavior

Each frontend app includes a local theme provider that:

- wraps `next-themes`
- defaults to system theme
- disables transition flashes on theme change
- listens for the `d` key and toggles light/dark mode when the user is not typing in an input-like element

### Current pages

Right now, the default page in all three frontend apps is essentially the same starter content:

- "Project ready!"
- shared `Button`
- shared `Tooltip`
- hint that pressing `d` toggles dark mode

In other words, the repo is structurally ready for feature work, but the app-specific product surfaces have not diverged yet.

## Shared UI Notes

The UI package is the main design system foundation for the workspace.

### Component generation model

The repo is set up like a shared shadcn-style system:

- app-level `components.json` files point to the shared package
- generated components live in `packages/ui/src/components`
- apps consume them through `@workspace/ui/components/...`

Example import:

```tsx
import { Button } from "@workspace/ui/components/button"
```

### Alias behavior

App-level aliases map:

- `ui` -> `@workspace/ui/components`
- `utils` -> `@workspace/ui/lib/utils`

Package-level aliases inside `packages/ui/components.json` map internal generation paths back into the package itself.

### Styling conventions

The workspace uses:

- CSS variables
- Tailwind utility classes
- `cn(...)` for class merging
- Prettier Tailwind sorting via `prettier-plugin-tailwindcss`

## Linting, Formatting, and Type Safety

### ESLint

- root `.eslintrc.js` mainly defines ignore patterns
- each workspace has its own `eslint.config.js`
- shared rules live in `packages/eslint-config`

### TypeScript

- root `tsconfig.json` extends the shared base config
- app/package TS configs build on shared config from `packages/typescript-config`

### Prettier

Current formatting conventions from `.prettierrc`:

- no semicolons
- double quotes
- tab width `2`
- trailing commas `es5`
- print width `80`
- Tailwind class sorting enabled

## Current Project Status

This is a good foundation repo, but it is still early-stage.

What is in place:

- monorepo wiring
- shared package boundaries
- three bootable Next.js apps
- one bootable Fastify app
- a starter PostgreSQL schema
- shared component package
- shared lint/type tooling

What is still mostly scaffolded:

- the three frontend home pages
- backend business routes
- runtime DB integration in the HTTP layer
- tests
- project-specific docs beyond this README

## Known Gaps and Gotchas

- There is no real automated test suite committed yet.
- The backend example env file uses `PORT=3003`.
- The backend `DATABASE_URL` is required for Drizzle commands and for any future runtime DB access.
- The backend currently imports `users` in `src/index.ts` without using it, which suggests in-progress route wiring.
- The frontend apps are visually and structurally nearly identical at the moment, so their intended product boundaries still need to be implemented in code.
- Because this is a monorepo, shared package changes can affect multiple apps at once. That is useful, but it also raises the blast radius of UI/config changes.

## Suggested Next Steps

If you are continuing development on this repo, the highest-leverage next steps are probably:

1. Decide the role of each frontend app so `web`, `dashboard`, and `admin` stop sharing the same placeholder surface.
2. Fix and standardize backend local env defaults, especially the port collision in `apps/backend/.env.example`.
3. Enable database-backed routes in `apps/backend/src/index.ts`.
4. Add a minimal test strategy, even if it starts with a few smoke tests or route-level integration tests.
5. Add app-specific setup docs once auth, deployments, or third-party integrations are introduced.

## Quick Start Summary

```bash
pnpm install
Copy-Item apps/backend/.env.example apps/backend/.env
```

Then edit `apps/backend/.env` so the port is:

```env
PORT=3003
```

Then run:

```bash
pnpm dev
```

Open:

- `http://localhost:3000` for `web`
- `http://localhost:3001` for `dashboard`
- `http://localhost:3002` for `admin`
- `http://localhost:3003` for `backend`
