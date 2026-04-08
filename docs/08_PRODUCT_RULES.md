# Product Rules

## Provisioning

- Manual provisioning remains the default fulfillment path
- No instance without successful payment

## Billing

- Billing is invoice-first
- Every checkout creates an order, invoice, and initial transaction
- Transactions represent payment attempts, not entitlement
- Renewals extend the existing instance instead of creating a duplicate one

## Infrastructure

- One server can only back one active instance at a time
- Termination must free server capacity for reuse

## Expiry

- Hard expiry, no grace period is currently modeled

## Discounts

- Pricing currently uses per-user discount fields
- Coupon tables exist in the schema for future use

## Support

- Support stays separate from billing and provisioning logic
