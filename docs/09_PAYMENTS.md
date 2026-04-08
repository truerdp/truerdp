# Payments

## Supported Methods

- UPI
- USDT TRC20

## Current Flow

1. User starts a checkout for a plan or renewal
2. Backend creates an order
3. Backend creates an invoice for that order
4. Backend creates a pending transaction for that invoice
5. Admin confirms the transaction manually
6. Backend marks the invoice paid
7. Backend creates or updates the instance

## Rules

- No auto-confirmation today
- No instance creation before successful payment
- Revenue should be interpreted from paid invoices
- New purchases require a provisioning step after payment confirmation

## Current Limitation

- The current route layer creates one pending transaction per checkout
- The schema is prepared for multiple transaction attempts per invoice when the payment flow becomes more advanced

## Future

- Webhook-based payment settlement
- Explicit retry flows for failed or abandoned invoices
- Automated invoice expiry handling
