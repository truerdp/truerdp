# Backend Structure

## Current Shape

`apps/backend/src`

- `routes/`: HTTP layer
- `services/`: business logic and billing orchestration
- `middleware/`: auth guards
- `validators/`: request validation
- `schema.ts`: Drizzle schema
- `db.ts`: database bootstrap

## Billing-Specific Rule

- Billing orchestration belongs in services, not route handlers
- Transaction routes and renewal routes should call shared billing helpers
- Admin confirmation should settle financial records before fulfillment changes

## Practical Mapping

- `routes/transaction.ts`: user checkout entry point
- `routes/instance.ts`: owned instance read models plus renewals
- `routes/admin.ts`: payment confirmation, provisioning, and admin reads
- `services/billing.ts`: shared `order -> invoice -> transaction` logic
- `services/pricing.ts`: price calculation only

## Rules

- Routes stay thin
- Validation stays close to request boundaries
- Services own workflow transitions
