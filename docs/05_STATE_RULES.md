# State Rules

## Financial State Rules

- An order must exist before an invoice can exist
- An invoice must exist before a transaction can exist
- A transaction confirms payment for exactly one invoice
- A paid invoice cannot remain attached to a pending transaction

## Fulfillment State Rules

- Instances must only be created after a successful payment
- New purchase confirmation creates a `pending` instance
- Renewal confirmation extends the existing instance instead of creating a new one
- Provisioning completes the order for a new purchase

## Guards

- A transaction cannot be confirmed twice
- Renewal creation is blocked when a pending renewal transaction already exists for the instance
- Renewal must use the instance's current plan
- Users cannot renew or inspect instances they do not own
- Credentials are returned only for active instances

## Derived Behavior

- User-facing APIs may surface an `active` instance as effectively `expired` when `expiryDate` is in the past
- Billing history joins transaction, invoice, and order data into one response model for the UI

## Enforcement

- Backend validation is authoritative
- Financial state changes happen inside the backend, not in the client
