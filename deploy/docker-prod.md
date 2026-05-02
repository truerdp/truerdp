# VPS Production Deployment

This guide documents the production backend setup for a small Ubuntu VPS, such
as a DigitalOcean Droplet. It assumes:

- `api.truerdp.com` points to the VPS public IP.
- Postgres is hosted externally in Neon.
- The VPS runs only Docker, the backend container, Nginx, and Certbot.
- Frontend apps remain deployed separately, for example on Vercel.

The production backend uses `docker-compose.prod.yml` and
`apps/backend/Dockerfile.prod`.

## 1) DNS

Create an A record at your DNS provider:

```txt
Type: A Record
Host: api
Value: <vps-public-ip>
TTL: Automatic
```

For example:

```txt
api.truerdp.com -> 159.223.115.183
```

Check propagation:

```bash
dig api.truerdp.com
```

The answer should include the VPS public IP.

## 2) Server setup

SSH into the VPS:

```bash
ssh root@<vps-public-ip>
```

Update Ubuntu and install basic tools:

```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx certbot python3-certbot-nginx
```

Install Docker Engine and the Compose plugin:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Verify:

```bash
docker --version
docker compose version
```

On 1 GB RAM VPS instances, add swap before building images:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

## 3) Clone the repo

```bash
cd /opt
git clone <your-github-repo-url> truerdp
cd /opt/truerdp
```

The host Node.js version is not used by the backend container. If `pnpm` warns
that host Node is below the repo engine, it is only a host-side warning for the
wrapper script. The container runs Node from `node:20-alpine`.

## 4) Root compose env

Create `/opt/truerdp/.env`:

```bash
nano .env
```

Set values used by Docker Compose interpolation:

```env
# Required because docker-compose.prod.yml still defines a local db service,
# even when starting only the backend service.
POSTGRES_PASSWORD=not-used-with-neon

# Use the real Neon connection string. Do not leave placeholder text here.
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require

BACKEND_ENV_FILE=apps/backend/.env.production.local
BACKEND_BIND_HOST=127.0.0.1
BACKEND_PORT=3003
```

Important: `DATABASE_URL` must be a real Postgres URL. If the container logs show
`input: 'YOUR_NEON_DATABASE_URL'`, a placeholder value is still being loaded.

## 5) Backend env

Create the backend runtime env file:

```bash
nano apps/backend/.env.production.local
```

Set production values:

```env
NODE_ENV=production
PORT=3003
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require

CORS_ALLOWED_ORIGINS=https://truerdp.com,https://dashboard.truerdp.com,https://admin.truerdp.com

JWT_SECRET=...
COOKIE_SECRET=...

# Payment, email, CMS, and webhook provider secrets go here.
```

Use Neon's pooled connection string for normal backend runtime when available.
Use a direct Neon connection string for migrations if the pooled URL causes
migration issues.

## 6) Build and start the backend

Start only the backend service:

```bash
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

You can also use the package script:

```bash
pnpm run docker:prod:up:backend
```

Do not use local development commands on the VPS production deployment:

```bash
pnpm run dev:backend:restart
pnpm run dev:docker
pnpm dev
```

Those commands use `docker-compose.yml`, not `docker-compose.prod.yml`.

## 7) Verify the container

Check status and logs:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Test from the VPS:

```bash
curl http://127.0.0.1:3003/
```

Expected response:

```json
{"status":"ok","message":"Truerdp API is running"}
```

## 8) Nginx reverse proxy

Install the Nginx site config from this repo:

```bash
cp deploy/nginx/api.truerdp.com.conf /etc/nginx/sites-available/api.truerdp.com.conf
ln -s /etc/nginx/sites-available/api.truerdp.com.conf /etc/nginx/sites-enabled/api.truerdp.com.conf
nginx -t
systemctl reload nginx
```

If the default Nginx site conflicts, remove it:

```bash
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Verify HTTP:

```bash
curl http://api.truerdp.com/
```

## 9) TLS with Certbot

Once DNS resolves to the VPS, issue a certificate:

```bash
certbot --nginx -d api.truerdp.com --redirect
```

Verify HTTPS:

```bash
curl https://api.truerdp.com/
```

## 10) Firewall

Allow SSH, HTTP, and HTTPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Do not expose port `3003` publicly. The backend is bound to `127.0.0.1:3003`
and should be reached through Nginx.

## 11) Migrations

Run production migrations against Neon from a controlled environment, such as
GitHub Actions, using the `PRODUCTION_DATABASE_URL` secret:

```bash
pnpm --filter backend db:migrate
```

If running manually from the VPS, make sure `DATABASE_URL` is the real Neon URL:

```bash
docker compose -f docker-compose.prod.yml exec backend pnpm --filter backend db:migrate
```

## 12) Frontend configuration

Set this environment variable in each frontend deployment:

```env
NEXT_PUBLIC_API_URL=https://api.truerdp.com
```

Then redeploy:

- `web`
- `dashboard`
- `admin`

## 13) Deploy updates

For code or dependency changes:

```bash
ssh root@<vps-public-ip>
cd /opt/truerdp
git pull
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
docker compose -f docker-compose.prod.yml logs -f backend
```

For env-only changes:

```bash
cd /opt/truerdp
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps backend
```

Restart without rebuilding:

```bash
docker compose -f docker-compose.prod.yml restart backend
```

Stop:

```bash
docker compose -f docker-compose.prod.yml down
```

## 14) GitHub Actions deploys

Backend deployments are automated by `.github/workflows/deploy-backend.yml`.
The workflow runs on pushes to `main` that touch backend, package, Docker, or
workflow files. It can also be run manually from the GitHub Actions tab.

The deploy workflow does this in order:

1. Installs dependencies with pnpm.
2. Typechecks and builds the backend.
3. Runs Drizzle migrations against Neon.
4. SSHes into the VPS.
5. Pulls `main`.
6. Rebuilds and restarts the backend container.
7. Checks `https://api.truerdp.com/`.

Required GitHub environment or repository secrets:

```txt
PRODUCTION_DATABASE_URL
DO_SSH_HOST
DO_SSH_USER
DO_SSH_PRIVATE_KEY
```

Recommended values:

```txt
PRODUCTION_DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
DO_SSH_HOST=<vps-public-ip>
DO_SSH_USER=root
DO_SSH_PRIVATE_KEY=<private SSH key with access to the VPS>
```

Optional secret:

```txt
BACKEND_HEALTH_URL=https://api.truerdp.com/
```

If `BACKEND_HEALTH_URL` is not set, the workflow uses
`https://api.truerdp.com/`.

The VPS must already have the repo cloned at:

```txt
/opt/truerdp
```

The deploy command intentionally uses `git pull --ff-only`; if tracked files
were edited directly on the VPS, the deployment fails instead of overwriting
those changes. Keep production-only values in `.env` and
`apps/backend/.env.production.local`, which are untracked.

The standalone `.github/workflows/migrate.yml` workflow is manual-only and is
kept for emergency migration runs.

## 15) Troubleshooting

If Compose says `POSTGRES_PASSWORD is required`, create or fix the root
`/opt/truerdp/.env` file. Compose parses all services in
`docker-compose.prod.yml`, including the optional local `db` service.

If logs show `Invalid URL` and `input: 'YOUR_NEON_DATABASE_URL'`, replace the
placeholder in both `.env` and `apps/backend/.env.production.local`.

If Docker build fails with `error reading from server: EOF`, check RAM and disk:

```bash
free -h
df -h
docker system df
dmesg -T | tail -80
```

Then clean failed build state and retry:

```bash
docker builder prune -f
docker system prune -f
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

If GitHub Actions fails during the SSH deploy step with
`client_loop: send disconnect: Broken pipe`, the remote Docker build likely
went quiet long enough for the SSH connection to be dropped. The deploy workflow
uses SSH keepalives for this. If it still happens, check whether the backend is
healthy and whether the remote repo reached the target commit:

```bash
ssh root@<vps-public-ip>
cd /opt/truerdp
git rev-parse --short HEAD
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3003/
```

If host `pnpm` warns about Node `<20`, either ignore it when using Docker or
upgrade host Node later. The production container uses Node 20.
