# Authentication & Authorization

## Overview

This system uses a simple, strict role-based access model.

Goals:

- Keep implementation simple
- Protect critical operations
- Allow safe delegation (operator role)
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
- Token expiry: 1–3 days

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

- View own instances
- Initiate purchase
- View invoices
- Create and reply to tickets

Restrictions:

- Cannot access admin routes
- Cannot modify system state

---

### Operator (Assistant Role)

Purpose:

- Execute operational tasks without full control

Capabilities:

- All user permissions
- View transactions
- View instances
- Start provisioning
- Reply to tickets

Restrictions:

- Cannot confirm payments
- Cannot assign servers
- Cannot activate instances
- Cannot terminate instances
- Cannot manage users or roles

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

## Permission Model

Principle:

- Separate decision from execution

The table below defines the **minimum role required**:

| Action             | Minimum Role |
| ------------------ | ------------ |
| Confirm payment    | admin        |
| Assign server      | admin        |
| Start provisioning | operator     |
| Activate instance  | admin        |
| Terminate instance | admin        |
| Reply to tickets   | operator     |

---

## Backend Enforcement

Rules:

- Authorization must be enforced in backend
- Frontend must never be trusted

Example (hierarchical check):

const roles = { user: 1, operator: 2, admin: 3 }

if (roles[user.role] < roles.operator) {
throw new Error('Forbidden')
}

---

## Security

### Passwords

- Must be hashed using bcrypt
- Never stored in plain text

### JWT

- Signed using secret key
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
