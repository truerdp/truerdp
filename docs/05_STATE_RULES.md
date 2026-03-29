# State Rules

## Valid Transitions

pending → provisioning
provisioning → active
active → expired
expired → termination_pending
termination_pending → terminated

## Invalid Cases

- Cannot activate if not provisioning
- Cannot assign server if not available
- Cannot terminate twice

## Enforcement

Backend must enforce all rules
