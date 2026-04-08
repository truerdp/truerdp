# Admin Workflow

This workflow reflects the currently implemented manual-first admin flow.

## New Purchase Flow

1. Review pending transactions via `GET /admin/transactions/pending`
2. Confirm a transaction via `POST /admin/transactions/:id/confirm`
3. Confirmation marks the invoice paid, creates an instance in `pending`, and moves the order to `processing`
4. Provision the instance via `POST /admin/instances/:id/provision`
5. Provisioning stores credentials, marks the instance `active`, and marks the order `completed`

## Renewal Flow

1. User creates a renewal request from an existing instance
2. Admin confirms the pending renewal transaction
3. Confirmation marks the invoice paid, extends the instance expiry, and marks the order `completed`
4. No separate provisioning step is required for a normal renewal

## Admin Read Views

- `GET /admin/transactions/pending`
- `GET /admin/instances`
- `GET /admin/stats`

## Notes

- Provisioning is still manual-first
- Pending transaction views now carry invoice and order context
- Revenue stats are derived from paid invoices
