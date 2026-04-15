# TrueRDP Progress

Reviewed on: 2026-04-15

This document reflects the current repo state, not just the product vision in `about.md`.

## Snapshot

- Backend and dashboard are the most mature parts of the system.
- Admin is partially built and already supports several real operations.
- Web/public storefront is still mostly scaffold-level.
- Email, notifications, and automated provisioning are still planned.

## App Status

- `apps/backend` — `Done / strongest area`
  Fastify API, auth, plans, billing, transactions, instances, and admin lifecycle routes are implemented.

- `apps/dashboard` — `Done / strongest frontend area`
  User dashboard includes instance list, instance detail, credential access, renewal flow, and transaction history.

- `apps/admin` — `In Progress`
  Admin dashboard includes expiring/expired instance views plus extend, terminate, confirm-payment, and provision actions, but it is not yet a full operations panel.

- `apps/web` — `Not Started / scaffold`
  Public website is still a starter page and does not yet represent the full purchase or marketing flow.

## Feature Checklist

- `Done` Monorepo architecture
  `apps/web`, `apps/dashboard`, `apps/admin`, `apps/backend`, and shared packages such as `packages/ui` and `packages/api` are all in place.

- `Done` Shared engineering foundation
  `pnpm` workspace, Turborepo, shared TypeScript config, shared ESLint config, Docker compose, env examples, migrations, and seed scripts are already set up.

- `Done` Core repo guidance
  The repo has a consolidated status summary in `progress.md` and a product overview in `about.md`; the old `docs/` folder has been removed.

- `In Progress` Account system
  Login, current-user, and profile APIs exist, and there is a user creation route for development/testing. A polished production registration flow and the full "account required before purchase" storefront flow are not yet complete.

- `Done` RDP instance lifecycle model
  Lifecycle states such as `pending`, `provisioning`, `active`, `expired`, and `terminated` are modeled in the schema and used in backend/admin flows.

- `In Progress` Instance management
  Users can view instances, open instance details, view credentials for active instances, track expiry, and trigger renewals. This area is usable, but still tied to the current billing/admin workflow rather than a full polished self-serve customer flow.

- `In Progress` Admin controls
  Admin can confirm pending transactions, provision instances manually, extend instances, terminate instances, and review expiring/expired instances. Broader user management and a more complete operations UI are still missing.

- `In Progress` Pricing and plan support
  Plans and duration-based pricing are implemented in the schema and backend APIs, including active pricing lookup. Flexible pricing exists at the data/API level, but not yet as a complete admin-facing management experience or public purchase flow.

- `In Progress` Payments
  Invoice-first billing is implemented and supports transaction creation plus confirmation. Current supported billing methods in the service layer are `upi` and `usdt_trc20`; card support, polished international payment handling, and proper currency localization are not complete yet.

- `Not Started` Email and notification system
  Transactional emails, admin notifications, reminder jobs, and provider abstraction are still planned only.

- `Done` Backend module foundations
  The repo already contains concrete backend routes/services for authentication, plans, transactions, instance management, admin lifecycle actions, and invoice-first billing.

- `In Progress` Frontend strategy
  The API-first and shared-component approach is visible in the repo, and dashboard/admin both consume backend APIs. The public web app still needs to be built out to match the documented product vision.

- `Done` Manual provisioning model
  Manual admin provisioning is already implemented as the current provisioning approach.

- `Not Started` Automated provisioning
  Cloud/provider automation and queue-based provisioning are still future work.

- `In Progress` Security and access control
  JWT auth, request validation, ownership checks, and role checks are present. Production hardening is still needed in some areas, such as permissive CORS, the development-friendly user creation route, and safer handling of stored server/instance credentials.

- `In Progress` Scalability foundations
  Modular monorepo structure, shared packages, and clean backend separation are already in place. Queue processing, provider abstraction at runtime, and deeper operational scaling features are still not built.

- `Not Started` Roadmap enhancements
  Coupons, advanced analytics, multi-region deployment, subscription auto-renewal, and richer automation remain future scope.

## What Is Clearly Already Working

- Backend server startup and route registration
- Database-backed billing model with `user -> order -> invoice -> transaction -> instance`
- Login and authenticated profile retrieval
- Active plans lookup
- User transaction listing
- User instance listing and instance detail pages
- Renewal transaction creation for eligible instances
- Instance transaction history
- Admin confirmation of pending transactions
- Admin manual provisioning of paid instances
- Admin extend and terminate actions
- Admin visibility into expiring and expired instances

## Biggest Gaps Right Now

- Public marketing website and purchase flow in `apps/web`
- Production-grade signup/onboarding flow
- Card payment support and fuller currency handling
- Email and reminder system
- Automated provisioning and cloud integrations
- Security hardening for production use

## Notes

- `about.md` still mixes present-state architecture with roadmap items, so several sections describe the intended product rather than fully completed work.
- The root `README.md` says both `web` and `admin` are shell-level, but the current codebase shows `admin` has moved beyond that and already has meaningful functionality.
- The legacy `docs/` folder is no longer present, so any references to it here should be treated as historical context only.
