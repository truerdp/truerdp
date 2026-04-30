# Docker Production Deployment (VPS)

This guide is for deploying backend + Postgres on a VPS (DigitalOcean, Hetzner,
etc.) using the production Docker setup in this repo.

## 1) Server prerequisites

Install Docker Engine + Docker Compose plugin on the VPS.

Open firewall ports:

- `22` (SSH)
- `80` (HTTP)
- `443` (HTTPS)

## 2) Clone and prepare

```bash
git clone <your-repo-url> truerdp
cd truerdp
```

Create production backend env file:

```bash
cp apps/backend/.env.production.example apps/backend/.env.production.local
```

Edit:

- `apps/backend/.env.production.local`

Set all secrets and production domains before starting.

## 3) Choose database mode

### Option A: Managed database (Neon/RDS/etc.)

In `apps/backend/.env.production.local`, set:

```env
DATABASE_URL=postgresql://... (managed DB URL)
```

Start backend only:

```bash
pnpm run docker:prod:up:backend
```

### Option B: Postgres inside Compose

Export DB bootstrap vars:

```bash
export POSTGRES_PASSWORD="<strong-password>"
export POSTGRES_USER="truerdp"
export POSTGRES_DB="truerdp"
export BACKEND_ENV_FILE="apps/backend/.env.production.local"
export BACKEND_PORT="3003"
export BACKEND_BIND_HOST="127.0.0.1"
```

Start full stack:

```bash
pnpm run docker:prod:up
```

## 4) Run migrations and seed (first deployment only)

Run migrations:

```bash
docker compose -f docker-compose.prod.yml exec backend pnpm --filter backend db:migrate
```

Optional seed:

```bash
docker compose -f docker-compose.prod.yml exec backend pnpm --filter backend db:seed
```

## 5) Verify

```bash
pnpm run docker:prod:logs
curl -sS http://127.0.0.1:3003/
```

Expected response contains:

```json
{"status":"ok","message":"Truerdp API is running"}
```

## 6) Reverse proxy + TLS

Install Nginx + Certbot:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Install Nginx site config from this repo:

```bash
sudo cp deploy/nginx/api.truerdp.com.conf /etc/nginx/sites-available/api.truerdp.com.conf
sudo ln -s /etc/nginx/sites-available/api.truerdp.com.conf /etc/nginx/sites-enabled/api.truerdp.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

Issue TLS cert and enforce HTTPS redirect:

```bash
sudo certbot --nginx -d api.truerdp.com --redirect -m you@truerdp.com --agree-tos --no-eff-email
```

Verify:

```bash
curl -I https://api.truerdp.com/
```

Harden firewall:

- Keep only `22`, `80`, `443` open publicly.
- Keep `3003` and `5432` private.
- If UFW is enabled:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3003/tcp
sudo ufw deny 5432/tcp
```

## 7) Updates

```bash
git pull
pnpm run docker:prod:up
```

## 8) Rollback (basic)

If deploy fails, checkout previous commit and re-run:

```bash
git checkout <previous-stable-commit>
pnpm run docker:prod:up
```
