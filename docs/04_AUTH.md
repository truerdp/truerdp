# Authentication & Authorization

## Overview

This system uses a simple, strict role-based access model.

Goals:

- Keep implementation simple
- Protect critical operations
- Leave room for delegated operational roles later
- Avoid unnecessary complexity

---

## Authentication

### Method

- JWT (JSON Web Tokens)

### Flow

1. User registers
2. User logs in
3. Backend returns JWT
4. Client sends token in headers

### Header Format

Authorization: Bearer <token>

---

## Token Strategy

- Use a single JWT (no refresh tokens)
- Token expiry: 7 days

### Behavior

- User must log in again after token expiry
- No silent session refresh

### Rationale

- Simpler implementation
- Fewer edge cases
- Suitable for current system scale

### Future (Optional)

- Refresh tokens can be added if needed
- Token invalidation can be implemented using versioning

---

## Roles

Three roles are supported:

- user
- operator
- admin

---

## Role Hierarchy

admin > operator > user

- Higher roles inherit permissions of lower roles
- Admin has ALL permissions in the system
- Operator has all user permissions
- User has only basic access

---

## Role Definitions

### User

Capabilities:

- View owned instances
- Create transactions
- Renew owned instances
- View owned transaction history
- Fetch credentials for active owned instances

Restrictions:

- Cannot access admin routes
- Cannot access other users' data

---

### Operator (Assistant Role)

Purpose:

- Reserved for delegated operational work in the schema and authorization model

Capabilities:

- Role exists in the database enum and JWT payload shape

Restrictions:

- No operator-specific backend routes are currently implemented
- Current guarded routes effectively distinguish between authenticated users and `admin`

---

### Admin (Owner)

Capabilities:

- Full system control
- All operator and user permissions
- Confirm payments
- Assign servers
- Activate instances
- Terminate instances
- Manage users and roles

---

## Current Permission Model

Principle:

- Backend enforcement is authoritative
- Current implementation is simple: authenticated user routes plus explicit `admin` checks on admin routes

The table below defines the **minimum role required**:

| Action                               | Minimum Role |
| ------------------------------------ | ------------ |
| Register user                        | public       |
| Login                                | public       |
| Create transaction                   | user         |
| List own transactions                | user         |
| List own instances                   | user         |
| View one owned instance              | user         |
| Fetch owned instance credentials     | user         |
| Create renewal transaction           | user         |
| List transactions for owned instance | user         |
| Confirm pending transaction          | admin        |
| Provision pending instance           | admin        |
| View pending transactions            | admin        |
| View all instances                   | admin        |
| View stats                           | admin        |

---

## Backend Enforcement

Rules:

- Authorization must be enforced in backend
- Frontend must never be trusted

Example (hierarchical check):

```ts
const roles = { user: 1, operator: 2, admin: 3 }

if (roles[user.role] < roles.operator) {
  throw new Error("Forbidden")
}
```

---

## Security

### Passwords

- Must be hashed using bcrypt
- Never stored in plain text

### JWT

- Signed using secret key
- Includes `userId` and `role`
- Secret must be stored in environment variables
- Token must have expiration

### Data Access

- Users can only access their own data
- Never trust user-provided IDs
- Always derive user_id from JWT

---

## Optional Enhancements (Future)

- Token versioning (force logout)
- Audit logs (track admin/operator actions)
- Session tracking

---

## What NOT to implement

- OAuth / social login
- Complex RBAC system
- Dynamic permissions
- Refresh tokens (for now)

---

## Key Principle

Simple, strict, and secure.

- Minimal roles
- Clear hierarchy
- Backend-controlled enforcement
