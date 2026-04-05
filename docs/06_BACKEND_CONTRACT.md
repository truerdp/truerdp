# Backend Contract

This file documents the currently implemented HTTP contract in `apps/backend/src/routes`.

## Public Routes

### POST /users

- Create a user account
- Hash password before persistence
- Returns created user record

### POST /auth/login

- Authenticate by email and password
- Returns JWT plus basic user payload

## Authenticated User Routes

### POST /transactions

- Create a new transaction
- Accepts `planId`, `method`, and optional `instanceId`
- If `instanceId` is supplied, it is treated as a renewal transaction
- Prevents multiple pending renewal transactions for the same instance

### GET /transactions

- List the authenticated user's transactions
- Includes joined plan data
- Includes linked instance summary when applicable

### GET /instances

- List the authenticated user's instances
- Hides sensitive fields such as the stored instance password
- Derives `expired` for active instances whose `expiryDate` is in the past

### GET /instances/:id

- Return one owned instance
- Enforces ownership

### POST /instances/:id/credentials

- Return credentials for one owned instance
- Allowed only when the instance is `active`

### POST /instances/:id/renew

- Create a pending renewal transaction for an owned instance
- Reuses the instance's existing `planId`
- Calculates price through the pricing service

### GET /instances/:id/transactions

- Return transactions linked to an owned instance
- Ordered newest first

## Admin Routes

All admin routes require authentication plus `request.user.role === "admin"`.

### POST /admin/transactions/:id/confirm

- Confirm a pending transaction
- New purchase flow:
  creates a new instance in `pending`
- Renewal flow:
  extends the existing instance `expiryDate` based on the plan duration
- Marks the transaction as `confirmed`

### POST /admin/instances/:id/provision

- Provision a pending instance with `ipAddress`, `username`, and `password`
- Sets `startDate`, calculates `expiryDate`, and moves the instance to `active`

### GET /admin/transactions/pending

- List pending transactions

### GET /admin/instances

- List all instances with non-sensitive summary fields

### GET /admin/stats

- Return aggregate counts for users and transactions
- Return confirmed revenue total

## Not Yet Implemented

The schema already includes support-oriented and future lifecycle concepts, but these routes are not currently implemented:

- ticket endpoints
- terminate flows
- explicit `provisioning` route transitions
- server assignment automation

## PATCH /admin/instance/:id/terminate

- terminated
- server.status = available

## Tickets

POST /tickets
POST /tickets/:id/messages
PATCH /tickets/:id/close
