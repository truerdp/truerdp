# TrueRDP Architecture

## System Type

Manual-first RDP SaaS backed by Fastify and PostgreSQL.

## Core Billing Chain

`User -> Order -> Invoice -> Transaction -> Instance`

- `Order` captures purchase intent and a minimal plan snapshot.
- `Invoice` captures what the user owes and when that liability expires.
- `Transaction` captures a payment attempt against one invoice.
- `Instance` is fulfillment and must only exist after a successful payment.

## Components

- `apps/web`: public site
- `apps/dashboard`: authenticated user dashboard
- `apps/admin`: admin panel shell
- `apps/backend`: Fastify API
- PostgreSQL: source of truth for billing, users, and lifecycle state

## Backend Responsibilities

### Auth and users

- Register and authenticate users
- Issue JWTs with `userId` and `role`

### Billing

- `POST /transactions` creates an `order`, `invoice`, and initial `transaction`
- `POST /instances/:id/renew` creates a renewal order/invoice/transaction for an owned instance
- `GET /transactions` exposes payment attempts joined with invoice and order context

### Fulfillment

- Admin payment confirmation marks the transaction as confirmed
- Admin payment confirmation marks the invoice as paid
- New purchase confirmation creates an instance in `pending`
- Renewal confirmation extends the existing instance and completes the order immediately
- Admin provisioning moves a paid new purchase from `pending` to `active`

## Design Principles

- Financial records are created before infrastructure records
- Orders and invoices are immutable enough to preserve purchase intent
- Transactions are payment attempts, not fulfillment records
- Instance creation is downstream of successful payment
- Manual provisioning remains the final fulfillment step for new purchases

## Implemented Purchase Flow

1. User chooses a plan
2. Backend creates `order -> invoice -> transaction`
3. Admin confirms the pending transaction
4. Backend marks the invoice paid and the order `processing`
5. Backend creates an instance in `pending`
6. Admin provisions credentials
7. Backend marks the instance `active` and the order `completed`

## Implemented Renewal Flow

1. User requests renewal for an owned instance
2. Backend creates `order -> invoice -> transaction` with renewal metadata
3. Admin confirms the pending transaction
4. Backend marks the invoice paid and the order `completed`
5. Backend extends the existing instance expiry and keeps or restores it to `active`
