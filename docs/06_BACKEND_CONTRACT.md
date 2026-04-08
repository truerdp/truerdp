# Backend Contract

This file documents the currently implemented HTTP contract in `apps/backend/src/routes`.

## Public Routes

### POST /users

- Create a user account
- Accepts `email`, `password`, and optional `firstName` and `lastName`
- Hashes the password before persistence

### POST /auth/login

- Authenticate by email and password
- Returns JWT plus a minimal user payload

## Authenticated User Routes

### POST /transactions

- Create a new checkout flow for a plan
- Accepts `planId`, `method`, and optional `instanceId`
- Internally creates:
  `order -> invoice -> transaction`
- If `instanceId` is supplied, the request is treated as a renewal
- Renewal requests are blocked when another pending renewal transaction already exists for that instance

### GET /transactions

- List the authenticated user's transactions
- Each item includes transaction, invoice, order, plan, and optional instance summary data

### GET /instances

- List the authenticated user's instances
- Hides stored passwords
- Derives `expired` for active instances whose `expiryDate` is in the past

### GET /instances/:id

- Return one owned instance

### POST /instances/:id/credentials

- Return credentials for one owned instance
- Allowed only when the instance is `active`

### POST /instances/:id/renew

- Create a renewal checkout flow for an owned instance
- Internally creates:
  `order -> invoice -> transaction`
- Reuses the instance's existing `planId`
- Defaults the payment method to `upi` when none is supplied

### GET /instances/:id/transactions

- Return transactions linked to an owned instance
- Uses transaction metadata to relate renewals and paid purchases back to the instance
- Ordered newest first

## Admin Routes

All admin routes require authentication plus `request.user.role === "admin"`.

### POST /admin/transactions/:id/confirm

- Confirm a pending payment attempt
- Marks the transaction `confirmed`
- Marks the linked invoice `paid`
- New purchase flow:
  creates a new instance in `pending` and moves the order to `processing`
- Renewal flow:
  extends the existing instance and moves the order to `completed`

### POST /admin/instances/:id/provision

- Provision a pending instance with `ipAddress`, `username`, and `password`
- Sets `startDate`, calculates `expiryDate`, moves the instance to `active`
- Marks the linked order `completed` when a matching paid transaction exists

### GET /admin/transactions/pending

- List pending transactions with joined invoice, order, plan, and optional instance context

### GET /admin/instances

- List all instances with non-sensitive summary fields

### GET /admin/stats

- Return aggregate counts for users and transactions
- Revenue is calculated from paid invoices

## Not Yet Implemented

- explicit order and invoice REST resources
- webhook-driven payment settlement
- automated invoice expiry jobs
- ticket endpoints
