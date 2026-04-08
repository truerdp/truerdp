# Lifecycle

## Order Lifecycle

`pending_payment -> processing -> completed`

Alternative terminal path:

`pending_payment -> cancelled`

Rules:

- New purchases move to `processing` after payment confirmation
- Renewals move directly to `completed` after payment confirmation
- Provisioning completes a processing order

## Invoice Lifecycle

`unpaid -> paid`

Alternative terminal path:

`unpaid -> expired`

Rules:

- One invoice belongs to one order
- An invoice is the source of truth for payment liability

## Transaction Lifecycle

`pending -> confirmed`

Alternative terminal path:

`pending -> failed`

Rules:

- Transactions are payment attempts only
- Transaction confirmation is not allowed to create financial records retroactively
- A successful transaction settles its invoice

## Instance Lifecycle

`pending -> provisioning -> active -> expired -> termination_pending -> terminated`

Rules:

- No instance before successful payment
- New purchases create a `pending` instance after payment confirmation
- Renewals never create a second instance for the same renewal
- Provisioning remains manual-first
