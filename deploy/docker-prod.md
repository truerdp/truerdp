# VPS Production Deployment

Command to login to DigitalOcean droplet via SSH:

```txt
ssh ujjawal@159.223.115.183
```

This guide documents the production backend setup for a small Ubuntu VPS, such
as a DigitalOcean Droplet. It assumes:

- `api.truerdp.com` points to the VPS public IP.
- Postgres is hosted externally in Neon.
- The VPS runs only Docker, the backend container, and Caddy.
- Cloudflare is the public DNS/edge TLS provider and should use Full (strict).
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
apt install -y git curl gpg ufw debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
  tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
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

Use `apps/backend/.env.production.infisical` for `BACKEND_ENV_FILE` after the
Infisical render step succeeds. The `.env.production.local` value is only the
manual break-glass fallback.

Important: `DATABASE_URL` must be a real Postgres URL. If the container logs show
`input: 'YOUR_NEON_DATABASE_URL'`, a placeholder value is still being loaded.

## 5) Backend env with Infisical

Production backend secrets should come from Infisical. Follow
`deploy/infisical/README.md` to create the Infisical project and add the
DigitalOcean machine identity. The deploy script creates the ignored runtime
agent config from `deploy/infisical/backend-agent.yaml.example` if it is
missing.

Render the backend runtime env file:

```bash
pnpm run infisical:render:backend
```

The agent writes:

```txt
apps/backend/.env.production.infisical
```

Support ticket image uploads require these Cloudflare R2 values in Infisical
`prod` at `/` before `pnpm run prod:backend` will start the backend:

```env
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BASE_URL=
R2_ACCOUNT_ID=
# Or set R2_ENDPOINT instead of R2_ACCOUNT_ID.
R2_ENDPOINT=
```

Use a public bucket/custom-domain URL for `R2_PUBLIC_BASE_URL`, without a
trailing slash. The backend stores support images under the `support-tickets/`
prefix and returns URLs rooted at that base.

If Infisical is unavailable during an emergency, you can still set
`BACKEND_ENV_FILE=apps/backend/.env.production.local` and create that ignored
file manually. Treat that as a temporary break-glass path, not the normal
workflow.

## 6) Build and start the backend

Start only the backend service with the Infisical-rendered env file:

```bash
pnpm run prod:backend
```

The expanded form is:

```bash
pnpm run infisical:render:backend
BACKEND_ENV_FILE=apps/backend/.env.production.infisical \
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

Do not use local development commands on the VPS production deployment:

```bash
pnpm run dev:backend:restart
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
{ "status": "ok", "message": "Truerdp API is running" }
```

## 8) Caddy reverse proxy

If this VPS already has the old Nginx/Certbot setup, stop and disable Nginx
first so only one process owns ports `80` and `443`:

```bash
systemctl stop nginx || true
systemctl disable nginx || true
systemctl disable --now certbot.timer || true
systemctl restart caddy
```

Install the Caddy config from this repo:

```bash
cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
```

Verify HTTP:

```bash
curl http://api.truerdp.com/
```

## 9) TLS with Caddy and Cloudflare

Cloudflare should be set to SSL/TLS mode `Full (strict)`. In that mode,
Cloudflare still requires the VPS origin to serve a valid certificate for
`api.truerdp.com`. Caddy replaces both Nginx and Certbot here: it obtains and
renews the origin certificate automatically.

Verify HTTPS:

```bash
curl https://api.truerdp.com/
```

If first-time certificate issuance fails while the `api` DNS record is proxied
through Cloudflare, temporarily set only `api.truerdp.com` to DNS-only, restart
Caddy, wait for issuance to complete, and then proxy it through Cloudflare
again:

```bash
journalctl -u caddy -f
systemctl restart caddy
```

## 10) Firewall

Allow SSH, HTTP, and HTTPS:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

Do not expose port `3003` publicly. The backend is bound to `127.0.0.1:3003`
and should be reached through Caddy.

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
pnpm run prod:backend:refresh
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
6. Runs `pnpm run prod:backend` on the VPS.
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
those changes. Keep production-only values in Infisical, with only root `.env`,
the generated `apps/backend/.env.production.infisical`, the ignored
`deploy/infisical/runtime/backend-agent.yaml`, and optional break-glass
`apps/backend/.env.production.local` files on the VPS.

The standalone `.github/workflows/migrate.yml` workflow is manual-only and is
kept for emergency migration runs.

## 15) Troubleshooting

If Compose says `POSTGRES_PASSWORD is required`, create or fix the root
`/opt/truerdp/.env` file. Compose parses all services in
`docker-compose.prod.yml`, including the optional local `db` service.

If logs show `Invalid URL` and `input: 'YOUR_NEON_DATABASE_URL'`, replace the
placeholder in Infisical and re-run `pnpm run infisical:render:backend`. Also
check the root `.env` file if it overrides `DATABASE_URL`.

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
`Missing Infisical machine identity files`, create
`/etc/infisical/truerdp/client-id` and
`/etc/infisical/truerdp/client-secret` on the VPS using the values from the
Infisical production machine identity.

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
