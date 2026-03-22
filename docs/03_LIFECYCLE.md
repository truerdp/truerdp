# Instance Lifecycle

## States

pending
provisioning
active
expired
termination_pending
terminated

## Flow

pending → provisioning → active → expired → termination_pending → terminated

## Rules

- No skipping states
- Expired cannot become active
- Termination is manual
