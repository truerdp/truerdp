# Admin Workflow

This workflow reflects the currently implemented manual-first admin flow.

## New Purchase Flow

1. Review pending transactions via `GET /admin/transactions/pending`
2. Confirm a transaction via `POST /admin/transactions/:id/confirm`
3. This creates a new instance in `pending`
4. Provision the instance via `POST /admin/instances/:id/provision`
5. The provision step stores credentials and marks the instance `active`

## Renewal Flow

1. User creates a renewal request from an existing instance
2. Admin confirms the pending renewal transaction
3. Confirmation extends the existing instance `expiryDate`
4. No separate provisioning step is required for a normal renewal

## Admin Read Views

- `GET /admin/transactions/pending`
- `GET /admin/instances`
- `GET /admin/stats`

## Notes

- Provisioning is currently manual-first: admin enters the instance IP, username, and password
- There is no implemented termination or ticket workflow yet
