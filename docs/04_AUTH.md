# Authentication & Authorization

## Authentication

- JWT-based authentication
- Token contains `userId` and `role`
- Current token lifetime: 7 days

## Roles

- `user`
- `operator`
- `admin`

`operator` exists in the schema and token payload but does not yet have route-specific behavior.

## User Permissions

- Register and log in
- Create purchase transactions
- Create renewal transactions for owned instances
- View own transactions, invoices, and instance-linked payment history
- View owned instances and fetch credentials for active instances

## Admin Permissions

- Confirm pending transactions
- Settle invoices
- Create or extend instances after payment confirmation
- Provision pending instances
- Terminate and extend instances
- View system billing and instance read models

## Current Route-Level Rules

| Action | Minimum Role |
| --- | --- |
| Register user | public |
| Login | public |
| Create checkout transaction | user |
| List own transactions | user |
| List own instances | user |
| View one owned instance | user |
| Fetch owned instance credentials | user |
| Create renewal checkout | user |
| List transactions for owned instance | user |
| Confirm pending transaction | admin |
| Provision pending instance | admin |
| View pending transactions | admin |
| View all instances | admin |
| View stats | admin |

## Notes

- Backend authorization is authoritative
- Ownership checks always derive from the JWT, never from client-supplied user identifiers
- `POST /users` now accepts optional `firstName` and `lastName`; missing values are filled with safe defaults
