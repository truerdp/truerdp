# Truerdp Technical Architecture

## 1. Purpose and Scope

This document describes the current implementation architecture of the Truerdp monorepo as reflected by runtime configuration and source code.

It covers:

- Service boundaries and runtime topology
- API surface and route domains
- Persistence model and lifecycle states
- Billing, webhook, and provisioning orchestration
- Security controls and operational behavior
- Current constraints and extension points

This document intentionally uses implementation-level detail and avoids diagram syntax.

## 2. Monorepo Structure and Ownership Boundaries

Truerdp is a pnpm workspace with Turborepo task orchestration.

Top-level workspace members:

- apps/\*
- packages/\*

Primary runtime applications:

- apps/web: Next.js app on port 3000
- apps/dashboard: Next.js app on port 3001
- apps/admin: Next.js app on port 3002
- apps/backend: Fastify API on port 3003

Shared workspace packages:

- packages/api: common API abstractions and typing surface
- packages/ui: shared UI primitives and components
- packages/eslint-config and packages/typescript-config: workspace standards

Architectural boundary rule:

- Frontend apps are clients only and call the backend API over HTTP.
- Stateful domain decisions are centralized in backend services and PostgreSQL.

## 3. Runtime Topology

### 3.1 Local Runtime Model

Containerized services via docker compose:

- db: postgres:16, exposed on 5432
- backend: built from apps/backend/Dockerfile, exposed on 3003

Backend container dependency:

- backend waits for db health check success before startup

Volumes:

- db_data persists PostgreSQL data

Typical developer workflow:

- Start infrastructure and backend in Docker
- Run frontend apps with pnpm and turbo filtering

### 3.2 Process and Port Map

- Web client: localhost:3000
- Dashboard client: localhost:3001
- Admin client: localhost:3002
- Backend API: localhost:3003
- PostgreSQL: localhost:5432

## 4. Backend Service Architecture

### 4.1 Framework and Core Middleware

Backend stack:

- Fastify
- @fastify/cookie
- @fastify/cors
- Drizzle ORM with postgres client
- Zod request validation

Server-level behaviors:

- CORS allows configured origins from CORS_ALLOWED_ORIGINS.
- Non-production fallback can allow all origins if no list is configured.
- Additional onRequest origin enforcement is applied for mutating methods:
  POST, PUT, PATCH, DELETE.

### 4.2 Registered Route Domains

The backend registers these route modules:

- user routes
- auth routes
- plan routes
- order routes
- transaction routes
- admin routes
- instance routes
- webhook routes

Health endpoint:

- GET /

## 5. API Surface (Current)

### 5.1 Authentication and User Endpoints

- POST /users: public signup
- POST /auth/login: credential login, sets auth cookie
- POST /auth/logout: clears auth cookie
- GET /auth/session: returns active user session (auth required)
- GET /me: quick current user lookup (auth required)
- GET /profile: current user profile details (auth required)

Token handling:

- Auth accepts either session cookie or Bearer token.
- JWT secret is mandatory at runtime.

### 5.2 Plan and Catalog Endpoints

- GET /plans: active plans with optional filtering by type/location
- GET /plans/categories: derived plan types and plan locations

### 5.3 Billing Endpoints (User)

- POST /orders: create billing order (new purchase or renewal context)
- GET /orders/:id: fetch order for authenticated user
- POST /transactions: create transaction for order
- GET /transactions: list user transactions
- GET /invoices: list user invoices

Supported payment methods in current schema:

- upi
- usdt_trc20

### 5.4 Instance Lifecycle Endpoints (User)

- GET /instances: list user instances
- GET /instances/:id: instance details
- POST /instances/:id/credentials: fetch decrypted access credentials when active
- POST /instances/:id/renew: create renewal order for eligible instances
- GET /instances/:id/transactions: list instance-scoped transactions

### 5.5 Webhook Endpoint

- POST /webhooks/payments/:provider

Current provider-specific behavior:

- Razorpay signature verification via x-razorpay-signature when secret is configured
- Event normalization and deduplication before billing mutation

### 5.6 Admin Endpoints

Plan management:

- GET /admin/plans
- POST /admin/plans
- PUT /admin/plans/:id
- PATCH /admin/plans/:id/status

Transaction and invoice management:

- GET /admin/invoices
- GET /admin/transactions
- GET /admin/transactions/pending
- POST /admin/transactions/:id/confirm

Instance operations:

- GET /admin/instances
- GET /admin/instances/:id
- GET /admin/instances/expired
- GET /admin/instances/expiring-soon
- POST /admin/instances/:id/provision
- POST /admin/instances/:id/terminate
- POST /admin/instances/:id/extend

Server inventory operations:

- GET /admin/servers
- GET /admin/servers/available
- POST /admin/servers
- PATCH /admin/servers/:id/status

Administrative reporting:

- GET /admin/stats

Access control model:

- Admin routes require authentication and role-based admin check.

## 6. Persistence Model and State Machines

### 6.1 Core Enumerations

Role:

- user, operator, admin

Instance status:

- pending
- provisioning
- active
- expired
- termination_pending
- terminated
- failed

Server status:

- available
- assigned
- cleaning
- retired

Resource status:

- active
- released

Transaction status:

- pending
- confirmed
- failed

Order status:

- pending_payment
- processing
- completed
- cancelled

Invoice status:

- unpaid
- paid
- expired

Purchase kind:

- new_purchase
- renewal

### 6.2 Domain Tables by Bounded Context

Identity and access:

- users

Product catalog:

- plans
- plan_pricing

Billing:

- orders
- invoices
- transactions
- coupons

Provisioning and inventory:

- instances
- servers
- resources
- instance_extensions

Payment integration and traceability:

- payment_webhook_events

Support subsystem:

- tickets
- messages

### 6.3 Integrity and Idempotency Characteristics

- Transaction references are unique.
- Transaction idempotency keys are unique.
- Webhook events enforce provider + event_id uniqueness.
- Webhook ingestion uses insert-on-conflict-do-nothing for dedupe behavior.

## 7. Critical Business Flows

### 7.1 Purchase and Billing Flow

1. User selects plan pricing.
2. Backend creates order with status pending_payment.
3. Backend creates or reuses invoice and pending transaction as applicable.
4. Payment confirmation transitions transaction and dependent billing records.
5. Successful payment path enables provisioning progression.

Notable behavior:

- Pending invoice and transaction reuse logic is implemented for active payment windows.
- Stale unpaid invoices are expired and related pending transactions are marked failed.

### 7.2 Renewal Flow

1. User requests renewal on active or expired instance.
2. Backend validates plan pricing selection against instance plan.
3. Renewal order is created with purchase kind renewal.
4. Standard billing transaction lifecycle continues.

### 7.3 Webhook Reconciliation Flow

1. External provider posts event to webhook endpoint.
2. Provider parser normalizes event into internal payment event shape.
3. Event is persisted in payment_webhook_events.
4. Duplicate event IDs are ignored idempotently.
5. Matching transaction is resolved by external reference.
6. Succeeded events confirm pending transactions.
7. Failed events mark pending transactions failed and expire invoice/order paths.

### 7.4 Provisioning and Allocation Flow

1. Provisioning action targets instance and server.
2. Allocation transaction validates instance and server states.
3. Resource binding is created with assigned credentials metadata.
4. Server transitions to assigned.
5. Instance transitions to active with start date.

Deallocation behavior:

- Active resource is marked released.
- Server transitions to cleaning.

## 8. Security and Trust Boundaries

### 8.1 Authentication and Session Handling

- JWT token issued at login.
- Token transport supports cookie and Bearer header.
- Cookie controls are environment-driven:
  domain, secure, sameSite, maxAge, cookie name.

### 8.2 Authorization

- verifyAuth middleware enforces authenticated access.
- Admin APIs apply explicit role checks.

### 8.3 Sensitive Data Handling

- Resource credentials are encrypted with AES-256-GCM before persistence.
- Encryption key is derived from RESOURCE_CREDENTIALS_SECRET or JWT_SECRET fallback.

### 8.4 Webhook Integrity

- Razorpay signature verification is supported and enforced when secret exists.
- If secret is absent, backend logs warning and accepts payload.

## 9. Configuration and Environment Model

Key backend environment variables observed:

- DATABASE_URL
- PORT
- JWT_SECRET
- RESOURCE_CREDENTIALS_SECRET
- AUTH_COOKIE_NAME
- AUTH_COOKIE_DOMAIN
- AUTH_COOKIE_SECURE
- AUTH_COOKIE_SAME_SITE
- AUTH_COOKIE_MAX_AGE
- CORS_ALLOWED_ORIGINS

Provider-specific optional variable:

- RAZORPAY_WEBHOOK_SECRET

## 10. Operational Notes

### 10.1 Build and Dev Orchestration

Root scripts orchestrate:

- turbo build, dev, lint, format, typecheck
- frontend-only dev filtering for web/dashboard/admin
- docker-based startup and stop flows

### 10.2 Logging and Error Handling

- Fastify logger is enabled.
- Route handlers consistently return structured error objects.
- Billing and allocation domains use typed domain error classes for controlled status codes.

## 11. Current Architectural Strengths

- Clear separation between client, API, and persistence layers
- Explicit lifecycle state modeling across billing and infrastructure entities
- Idempotent webhook ingestion design
- Transactional allocation updates reduce partial state risk
- Shared package model reduces duplication across frontend applications

## 12. Current Architectural Gaps and Risks

- Webhook signature validation can be bypassed when secret is unset in non-hardened environments.
- Single backend process and single database instance imply vertical scaling limits in current local topology.
- Long-running workflows are synchronous in API paths, with no message broker or worker tier.
- Observability depth is currently log-centric; no explicit traces/metrics pipeline is present in the reviewed code.

## 13. Extension Points

Likely low-friction extension points in the current design:

- Additional payment providers via webhook adapter normalization strategy
- Additional server providers by extending server inventory and allocation adapter logic
- Background processing tier for asynchronous billing reconciliation and provisioning workflows
- API gateway and rate-limiting layer for external hardening in production topology

## 14. Architecture Summary

Truerdp is a layered monorepo system composed of three Next.js clients, a single Fastify backend, and a PostgreSQL system of record. The core of the architecture is lifecycle orchestration across orders, invoices, transactions, instances, servers, and resources. Payment webhook reconciliation and transactional allocation logic are central to maintaining consistency between financial state and infrastructure state.
