# DigitalOcean to Hetzner Migration Runbook

This runbook is for the future move from the current DigitalOcean backend VPS to
a cheaper Hetzner VPS after the DigitalOcean credit expires.

Current production layout:

- Frontends: Vercel
- Backend: DigitalOcean VPS at `api.truerdp.com`
- Database: Neon Postgres

Target layout:

- Frontends: still Vercel
- Backend: Hetzner VPS at `api.truerdp.com`
- Database: still Neon Postgres

Because the database stays on Neon and the frontends stay on Vercel, this is a
backend server migration. No database dump/restore should be needed.

## 1) Recommended Hetzner server

Use an Ubuntu LTS image, preferably the latest LTS available when migrating.

Suggested starting point:

```txt
2 vCPU / 2 GB RAM / 40 GB disk or better
```

The app can run on less, but Docker builds are much smoother with 2 GB+ RAM. If
using a 1 GB server, add at least 2 GB swap before building.

## 2) Prepare before cutover

Lower the DNS TTL for `api.truerdp.com` at least a few hours before migration.
Use something like:

```txt
TTL: 300 seconds
```

Record the current DigitalOcean public IP and the new Hetzner public IP:

```txt
Old backend IP: <digitalocean-ip>
New backend IP: <hetzner-ip>
```

Confirm the live backend is healthy before starting:

```bash
curl https://api.truerdp.com/
```

Expected:

```json
{"status":"ok","message":"Truerdp API is running"}
```

## 3) Create the Hetzner VPS

In Hetzner Cloud:

1. Create a new server.
2. Choose Ubuntu LTS.
3. Add your SSH key.
4. Choose the region closest to your users.
5. Create the server and copy its public IPv4 address.

SSH in:

```bash
ssh root@<hetzner-ip>
```

Update and install base packages:

```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx certbot python3-certbot-nginx
```

Install Docker:

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

Optional but recommended on small servers:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

## 4) Deploy the backend on Hetzner

Clone the repo:

```bash
cd /opt
git clone <your-github-repo-url> truerdp
cd /opt/truerdp
```

Create the root Compose env:

```bash
nano .env
```

Use the same production values as the DigitalOcean server:

```env
POSTGRES_PASSWORD=not-used-with-neon
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
BACKEND_ENV_FILE=apps/backend/.env.production.local
BACKEND_BIND_HOST=127.0.0.1
BACKEND_PORT=3003
```

Create the backend env file:

```bash
nano apps/backend/.env.production.local
```

Copy the production backend env values from the DigitalOcean server. Keep the
same secrets unless you intentionally rotate them:

```env
NODE_ENV=production
PORT=3003
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
CORS_ALLOWED_ORIGINS=https://truerdp.com,https://dashboard.truerdp.com,https://admin.truerdp.com
JWT_SECRET=...
COOKIE_SECRET=...
```

Start the backend:

```bash
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

Verify locally on the Hetzner VPS:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
curl http://127.0.0.1:3003/
```

## 5) Configure Nginx on Hetzner

Install the site config:

```bash
cp deploy/nginx/api.truerdp.com.conf /etc/nginx/sites-available/api.truerdp.com.conf
ln -s /etc/nginx/sites-available/api.truerdp.com.conf /etc/nginx/sites-enabled/api.truerdp.com.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Before changing DNS, test the new server by sending the right Host header
directly to the Hetzner IP:

```bash
curl -H "Host: api.truerdp.com" http://<hetzner-ip>/
```

This should return the backend health response.

## 6) Cut over DNS

At the DNS provider, update:

```txt
Type: A Record
Host: api
Value: <hetzner-ip>
TTL: 300 or Automatic
```

Watch propagation:

```bash
dig api.truerdp.com
```

Once `api.truerdp.com` resolves to the Hetzner IP, issue TLS on Hetzner:

```bash
certbot --nginx -d api.truerdp.com --redirect
```

Verify:

```bash
curl https://api.truerdp.com/
```

## 7) Firewall

Enable only SSH, HTTP, and HTTPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Port `3003` should remain private on `127.0.0.1`.

## 8) Post-cutover checks

Check backend:

```bash
curl https://api.truerdp.com/
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

Check frontend flows:

- Public site can reach backend.
- Dashboard login/session still works.
- Admin can load data.
- Checkout/payment routes still respond.
- Payment provider webhook URLs still point to `https://api.truerdp.com/...`.

No Vercel frontend env change is needed if `NEXT_PUBLIC_API_URL` is already:

```env
NEXT_PUBLIC_API_URL=https://api.truerdp.com
```

## 9) Rollback

If Hetzner has problems, point DNS back to the DigitalOcean IP:

```txt
Type: A Record
Host: api
Value: <digitalocean-ip>
TTL: 300
```

Because Neon remains the database, rollback is only a server traffic rollback.
Do not run destructive migrations during the migration window unless you have a
separate rollback plan.

Keep the DigitalOcean backend running for at least 24-48 hours after cutover.
After the Hetzner backend is stable, shut down the DigitalOcean container and
then destroy the old Droplet before the credit expires.

## 10) Future deploy command on Hetzner

For backend code changes:

```bash
ssh root@<hetzner-ip>
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

For restart only:

```bash
docker compose -f docker-compose.prod.yml restart backend
```
