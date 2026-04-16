This document is the single source of truth. Any code must strictly follow this specification.

# TrueRDP Enhancement Specification (Copilot-Ready)

## Objective

Enhance the current system to support an **inventory-based server allocation model** while preserving the **invoice-first architecture**.

---

## Core Principles (Non-Negotiable)

1. **Invoice-first**
   - No instance creation before `invoice.status = paid`
   - No server assignment before payment

2. **Inventory-first**
   - Servers are reusable assets
   - Servers exist independently of users

3. **Separation of Concerns**
   - Instance = business entity
   - Resource = assignment (binding)
   - Server = infrastructure (inventory)

4. **No Reservation System**
   - Servers must NOT be reserved before payment

5. **Idempotency & Safety**
   - Allocation must be idempotent and transactional

---

## Data Model (Authoritative)

### Servers (Inventory Layer)

```
servers:
  id
  provider
  externalId
  ipAddress (unique)
  cpu
  ram
  storage
  status: available | assigned | cleaning | retired
  lastAssignedAt
  createdAt
  updatedAt
```

---

### Resources (Binding Layer)

```
resources:
  id
  instanceId (unique)
  serverId (required)
  username
  passwordEncrypted
  status: active | released
  assignedAt
  releasedAt
```

---

### Instances (Business Layer)

```
instances:
  id
  userId
  originOrderId
  planId
  status
  startDate
  expiryDate
  provisionAttempts
  lastProvisionError
```

---

## 🔥 Resource vs Server Rules (Critical)

1. A **Server** represents a physical/virtual machine and is the ONLY owner of:
   - IP address
   - hardware specs
   - provider details

2. A **Resource** represents an ASSIGNMENT of a Server to an Instance:
   - MUST reference `serverId`
   - MUST NOT exist without a server
   - MUST NOT store infrastructure details like IP

3. A Server can exist WITHOUT a Resource (inventory)

4. A Resource cannot exist WITHOUT a Server

---

## 🔒 Invariants (Must Always Hold)

- At most ONE active resource per instance
- At most ONE active resource per server
- Server.status = 'available' → no active resource exists
- Server.status = 'assigned' → exactly one active resource exists

---

## Lifecycle Models

### Server Lifecycle

```
available → assigned → cleaning → available
                     ↓
                  retired
```

### Instance Lifecycle

```
pending → provisioning → active → expired → terminated
```

---

## Allocation Rules

1. Allocation ONLY after invoice is paid
2. Instance must be in `provisioning`
3. Server must be `available`
4. Must be transaction-safe
5. Must lock server row

---

## Allocation Flow

```
1. Payment confirmed
2. Create instance (status = provisioning)
3. Select server (manual or auto)
4. Create resource
5. Update server → assigned
6. Update instance → active
```

---

## Allocation Pseudo-code (Authoritative)

```ts
async function allocateServer(instanceId) {
  return db.transaction(async (tx) => {
    const instance = await tx.instances.find(instanceId)

    if (instance.status !== 'provisioning') {
      throw new Error('INVALID_INSTANCE_STATE')
    }

    const server = await tx.query(`
      SELECT * FROM servers
      WHERE status = 'available'
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `)

    if (!server) throw new Error('NO_SERVER_AVAILABLE')

    await tx.servers.update(server.id, {
      status: 'assigned',
      lastAssignedAt: new Date()
    })

    await tx.resources.insert({
      instanceId,
      serverId: server.id,
      status: 'active',
      assignedAt: new Date()
    })

    await tx.instances.update(instanceId, {
      status: 'active',
      startDate: new Date()
    })
  })
}
```

---

## Manual Provisioning Workflow

### Scenario A: No Inventory

1. Customer pays
2. Instance → provisioning
3. Admin buys server from provider (Hetzner)
4. Admin adds server to inventory (status = available)
5. Admin assigns server

---

### Scenario B: Inventory Available

1. Customer pays
2. Instance → provisioning
3. Admin assigns available server

---

### Scenario C: Pre-Bought Inventory

1. Admin buys server in advance
2. Adds to inventory as `available`
3. Later assigns to instance

---

## Deallocation Flow

```
1. Instance expired/terminated
2. Mark resource → released
3. Mark server → cleaning
4. Perform cleanup
5. Mark server → available
```

---

## Cleanup Requirements (MANDATORY)

- Reset password
- Remove all user data
- Rotate credentials
- Optional OS reinstall

---

## Concurrency & Safety

- Use DB transactions
- Use row locking (`FOR UPDATE SKIP LOCKED`)
- Enforce unique constraint on `resources.instanceId`

---

## Error Handling

### No server available

- Instance remains `provisioning`
- Admin must provision manually

### Allocation failure

- Rollback transaction
- Log failure

---

## What Copilot Must Follow

- Always use transactions
- Never assign server before payment
- Never create resource without serverId
- Never store IP in resources
- Always update server + resource + instance together
- Always validate lifecycle transitions

---

## What Must NEVER Happen

- ❌ Assign server before payment
- ❌ Reuse server without cleanup
- ❌ Multiple instances assigned to same server
- ❌ Resource without server
- ❌ Manual DB mutation bypassing logic

---

## Summary

This enhancement introduces a **clear separation between inventory, assignment, and business logic**, enabling:

- Cost optimization (reuse)
- Faster provisioning
- Strong consistency with invoice-first model

TrueRDP evolves into:

> **An inventory-driven infrastructure orchestration system**
