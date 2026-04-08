# DevOps Setup

## Philosophy

- Keep infrastructure simple
- Optimize for development speed, not scale
- Ensure reproducibility using Docker
- Design for future scaling without over-engineering

---

## Infrastructure (Phase 1)

### Architecture

Single VPS deployment.

All services run on the same server using Docker containers.

### Components

- Backend (Fastify)
- PostgreSQL
- Frontend (optional, later)
- Reverse proxy (Coolify / Nginx)

---

## Containerization

All services must run in Docker.

Use docker-compose for:

- local development
- production deployment

---

## Services

### Backend

- Fastify application
- Runs on port 3003

### Database

- PostgreSQL container
- Runs on port 5432

---

## Environment Variables

Use `.env` files.

Required variables:

- DATABASE_URL
- JWT_SECRET
- PORT

Never hardcode secrets.

---

## Database Strategy

### Current (Phase 1)

- PostgreSQL runs in same VPS (Docker container)

### Rules

- Use migrations
- Do not manually modify production DB

### Local Rebaseline Workflow

When local development intentionally discards existing rows and rebaselines to the current Drizzle schema:

1. Reset the local schemas:
   `psql postgresql://postgres:postgres@localhost:5432/truerdp -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA drizzle;"`
2. Run migrations:
   `pnpm --filter backend db:migrate`
3. Seed minimal dev data:
   `pnpm --filter backend db:seed`

Default local seed users:

- `admin@truerdp.local` / `password123`
- `user@truerdp.local` / `password123`

Default local seed catalog:

- `Starter RDP`
- `30 days` for `500`
- `90 days` for `1299`

---

## Backups (Critical)

- Daily PostgreSQL backup
- Store backups off-server (cloud or external storage)

---

## CI/CD (Simple)

### Tool

- GitHub Actions (optional initially)

### Flow

- Push to main branch
- Build Docker image
- Deploy via Coolify or SSH

### Rule

- Keep pipeline simple
- Avoid complex CI/CD setups

---

## Monitoring (Minimal)

Track:

- CPU usage
- Memory usage
- Disk usage

---

## Logging

- Log errors in backend
- Keep logging simple
- Avoid complex logging systems initially

---

## Scaling Strategy (Future)

### Phase 2

- Move PostgreSQL to a separate server

### Phase 3

- Run multiple backend instances

### Phase 4

- Add load balancer

---

## When to Separate Database

Move PostgreSQL to a separate server ONLY if:

- CPU usage is consistently high
- Database queries become slow
- Memory becomes a bottleneck
- Multiple backend instances are needed

---

## Migration Readiness

System must allow easy DB migration by:

- Using DATABASE_URL
- Avoiding hardcoded DB configs

---

## What NOT to use

- Kubernetes
- Microservices
- Multi-server architecture (initially)
- Complex CI/CD pipelines

---

## Key Principle

Simple > Scalable (for now)

Build a system that is:

- easy to deploy
- easy to debug
- easy to scale later
