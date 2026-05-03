# Refactoring Standards

This is the baseline we follow during the remainder of TrueRDP development.

## Goals

1. Keep files small enough to navigate quickly.
2. Remove `any` from application code.
3. Keep domain logic out of UI components.
4. Make routing, services, and data flow predictable across apps.

## Non-negotiable Rules

1. **No new `any`** in app code.
2. **Default max: 220 lines per file** (warnings now; keep trending downward).
3. **Route/controller files only orchestrate**:
   - parse input
   - call service(s)
   - map response
4. **Business logic belongs in services** (or domain modules), not route/UI files.
5. **Validation schemas live in dedicated validator/schema files**, not inline inside page/component files.
6. **UI components are presentational by default**:
   - data fetching in hooks/server components/actions
   - transformation helpers in `lib/` or `utils/`

## Folder Conventions

### Backend (`apps/backend/src`)

- `routes/`: HTTP layer only
- `services/`: domain and business workflows
- `validators/`: zod schemas and parse helpers
- `middleware/`: auth, authorization, request guards
- `types/`: shared app-level types

Recommended per route domain:

- `routes/<domain>.ts` registers endpoints
- `validators/<domain>.ts` owns request schemas
- `services/<domain>.ts` owns core logic

### Next apps (`apps/web`, `apps/dashboard`, `apps/admin`)

- `app/`: routes, layout composition, server actions
- `components/`: mostly presentational components
- `lib/`: data clients, formatters, pure helpers
- `hooks/`: reusable stateful UI logic
- `types/`: app-level types

Component limits:

- avoid >220 lines for regular components
- if component grows:
  - extract view sections
  - extract hooks
  - extract format/transform utilities

### Shared packages (`packages/*`)

- keep package exports explicit via `package.json` exports
- avoid deep imports from consuming apps
- colocate tests and stories when introduced

## Rollout Process (App by App)

1. Run `pnpm refactor:audit` and capture baseline.
2. Choose one app.
3. Split top 2-3 largest files in that app first.
4. Remove `any` from touched files.
5. Move non-UI logic out of UI files.
6. Run lint/typecheck for touched app.
7. Ship small, reviewable PRs.

## Enforcement

- ESLint now warns with stricter caps:
  - `@typescript-eslint/no-explicit-any`
  - `max-lines`:
    - `220` for most app/UI files
    - `260` for Next app route files
    - `320` only for backend service modules during migration
  - `max-lines-per-function`:
    - `90-120` for app layers
    - `140` for backend services during migration

These are migration-time warning thresholds, not quality targets. Prefer files closer to `120-180` lines when practical.
