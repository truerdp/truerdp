# Backend Refactor Plan

## Phase 1: Guardrails (completed)

- Added typed auth payload parsing in middleware.
- Added shared `requireAdmin` middleware helper.
- Enabled backend lint warnings for:
  - `no-explicit-any`
  - `max-lines`
  - `max-lines-per-function`

## Phase 2: Route Decomposition (next)

1. Split `routes/admin.ts` by domain:
   - plans + pricing
   - coupons
   - instances
   - servers
   - admin reporting/audit
2. Move validation schemas to `validators/admin/*`.
3. Move domain logic from route handlers into `services/admin/*`.

## Phase 3: Type Debt Burn-down

1. Remove `any` from `routes/*`.
2. Replace generic `catch (err: any)` with typed error handling utilities.
3. Tighten `request.params`, `request.query`, and `request.body` types in routes.

## Phase 4: Consistency Pass

1. Ensure all admin mutations write audit logs through one helper.
2. Add shared response helpers for common 400/403/404/500 responses.
3. Keep route files under the 220 line threshold.
