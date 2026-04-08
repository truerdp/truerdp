# AI Context

## System

Manual-first RDP system with invoice-first billing.

## Non-Negotiable Rules

- No instance before successful payment
- Financial flow is:
  `user -> order -> invoice -> transaction -> instance`
- Renewal extends an existing instance instead of creating a duplicate one
- Do not skip lifecycle transitions
- Do not auto-assign infrastructure unless explicitly asked

## Database

- PostgreSQL only
- Prefer relational integrity over convenience

## Coding Style

- Deterministic logic
- Strict validation
- Thin routes, shared services
