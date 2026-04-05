# State Rules

This document reflects the currently implemented backend behavior, not the full target lifecycle.

## Transaction State Transitions

Implemented transitions:

- `pending` -> `confirmed` when an admin confirms a transaction

Implemented guards:

- A transaction must exist before it can be confirmed
- A transaction cannot be confirmed twice
- Renewal creation is blocked when a pending transaction already exists for that instance

## Instance State Transitions

Implemented transitions:

- New purchase confirmation creates an instance in `pending`
- `pending` -> `active` when an admin provisions credentials
- Renewal confirmation keeps or restores the instance to `active` and extends `expiryDate`

Derived behavior:

- Expiry is treated as date-driven in user-facing APIs and UI
- `GET /instances` maps an `active` instance with a past `expiryDate` to `expired` in the response

Defined but not currently driven by routes:

- `provisioning`
- `termination_pending`
- `terminated`

## Invalid Cases

- Cannot provision a missing instance
- Cannot provision an instance unless it is currently `pending`
- Cannot renew an instance you do not own
- Cannot fetch credentials for an instance you do not own
- Cannot fetch credentials unless the instance is `active`

## Enforcement

- Backend must enforce ownership and role checks
- Frontend status displays may derive `expired` from `expiryDate`
