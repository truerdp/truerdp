# Domain Model

## User

- Owns orders, invoices, transactions, instances, and tickets
- Carries discount settings used by pricing

## Plan

- Defines product configuration and base price
- Referenced by orders and instances

## Order

- Represents purchase intent
- Stores `planId`, `planName`, `planPrice`, and `durationDays`
- Status: `pending_payment`, `processing`, `completed`, `cancelled`

## Invoice

- Represents financial liability for one order
- Stores subtotal, discount, total amount, currency, and expiry
- Status: `unpaid`, `paid`, `expired`

## Transaction

- Represents a payment attempt for one invoice
- Stores payment method, amount, status, optional reference, and metadata
- Status: `pending`, `confirmed`, `failed`

## Instance

- Represents fulfilled RDP access for a user
- Created only after payment confirmation
- Can be newly created or renewed through the billing flow

## Server

- Represents provisionable infrastructure capacity
- Can be assigned to an instance during manual provisioning

## Coupon and Coupon Usage

- Coupon defines a reusable discount rule
- Coupon usage links one user and one invoice to one coupon redemption

## Ticket and Message

- Supports the lean support workflow
- Kept separate from billing and provisioning logic
