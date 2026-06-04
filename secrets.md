# Deployment Environment Variables

Infisical Cloud is the intended source of truth for deployed secrets. Do not
commit real secret values here, and do not keep production values manually
duplicated across Vercel and DigitalOcean except for the DigitalOcean
machine-identity credential used to fetch secrets from Infisical.

Use one Infisical project with slug `true-rdp-58y0`.

Environments:

- `Production`: live production values.
- `Development`: local or shared development values.

Secrets live at the project root path (`/`) in each environment. Do not create
app-specific folders such as `/backend`, `/web`, or `/shared` unless we
explicitly decide to add access boundaries later.

Application code still reads `process.env`; Infisical only delivers the values.
The DigitalOcean backend renders root Production secrets into
`apps/backend/.env.production.infisical`. Vercel syncs should also use the root
path (`/`) for the selected Infisical environment.

## Root Secrets

Keep these names in Infisical root. Values below are examples or placeholders,
not real secrets.

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
PORT=3003

# Auth and encryption
JWT_SECRET=replace-with-long-random-secret
BETTER_AUTH_SECRET=replace-with-long-random-secret
BETTER_AUTH_URL=https://api.truerdp.com
RESOURCE_CREDENTIALS_SECRET=replace-with-long-random-secret

# Better Auth cookies
AUTH_COOKIE_NAME=truerdp_session
AUTH_COOKIE_DOMAIN=.truerdp.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_MAX_AGE=604800

# Backend and frontend URLs
CORS_ALLOWED_ORIGINS=https://truerdp.com,https://dashboard.truerdp.com,https://admin.truerdp.com
WEB_BASE_URL=https://truerdp.com
DASHBOARD_BASE_URL=https://dashboard.truerdp.com
BACKEND_BASE_URL=https://api.truerdp.com
NEXT_PUBLIC_API_URL=https://api.truerdp.com
NEXT_PUBLIC_WEB_URL=https://truerdp.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.truerdp.com
NEXT_PUBLIC_ADMIN_URL=https://admin.truerdp.com

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=TrueRDP <support@truerdp.com>
RESEND_REPLY_TO_EMAIL=
ADMIN_ALERT_EMAILS=

# Dodo Payments
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_DEFAULT_CURRENCY=USD
DODO_TAX_CATEGORY=

# CoinGate
COINGATE_ENVIRONMENT=sandbox
COINGATE_API_TOKEN=
COINGATE_RECEIVE_CURRENCY=DO_NOT_CONVERT
COINGATE_PENDING_STATUS_POLL_ATTEMPTS=4
COINGATE_PENDING_STATUS_POLL_DELAY_MS=500

# Web/CMS integrations
PAYLOAD_PUBLIC_URL=https://cms.truerdp.com
CMS_INTERNAL_API_URL=https://cms.truerdp.com
CMS_INTERNAL_API_TOKEN=
CMS_REVALIDATE_SECRET=
NEXT_PUBLIC_TAWK_TO_PROPERTY_ID=69f19d041b71d51c3915ab58
NEXT_PUBLIC_TAWK_TO_WIDGET_ID=1jnbsqn3o

# Dashboard/admin
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false

# CMS
PAYLOAD_SECRET=replace-with-long-random-secret

# Operations
EXPIRY_REMINDER_SWEEP_INTERVAL_MINUTES=0
EXPIRY_REMINDER_SWEEP_DAYS_AHEAD=3
PASSWORD_RESET_EXPOSE_LINK=false
```

## Notes

- Use the Neon pooled connection string for `DATABASE_URL` when available.
- Keep `?sslmode=require` in the Neon URL.
- `BETTER_AUTH_SECRET`, `JWT_SECRET`, `RESOURCE_CREDENTIALS_SECRET`, and
  `PAYLOAD_SECRET` must be long random values, not placeholders.
- `RESOURCE_CREDENTIALS_SECRET` protects stored resource credentials. Changing
  it later can make existing encrypted credentials unreadable.
- `CORS_ALLOWED_ORIGINS` must contain exact frontend origins, comma-separated,
  with `https://` and no trailing path.
- `NEXT_PUBLIC_*` values are public after a frontend build. After changing any
  `NEXT_PUBLIC_*` value, redeploy the affected Vercel apps.
- Set Dodo, CoinGate, and Resend values before enabling those flows in
  Production.
- If CMS and backend share the same Postgres database, keep `DATABASE_URL`
  intentionally identical in Infisical.
- `CMS_INTERNAL_API_TOKEN` and `CMS_REVALIDATE_SECRET` must match the values
  used by web/backend integrations.

## DigitalOcean Backend

The backend deployment uses Infisical Production root secrets:

```bash
pnpm run prod:backend
```

For secret-only changes:

```bash
pnpm run prod:backend:refresh
```

Do not edit `apps/backend/.env.production.infisical` by hand. It is generated
from Infisical and ignored by git.

## Development

Use the Infisical Development environment for shared development values. Local
`.env` files are still allowed as developer convenience and fallback, but they
should not become the source of truth for deployed environments.
