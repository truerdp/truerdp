# Deployment Environment Variables

Infisical Cloud is the intended source of truth for deployed secrets. Do not
commit real secret values here, and do not keep production values manually
duplicated across Vercel and DigitalOcean except for the DigitalOcean
machine-identity credential used to fetch secrets from Infisical.

Use one Infisical project with slug `truerdp`, environments `development`,
`preview`, and `production`, and these folders:

- `/shared`: common URLs/config used by multiple apps.
- `/backend`: backend runtime secrets.
- `/web`: web app values.
- `/dashboard`: dashboard app values.
- `/admin`: admin app values.
- `/cms`: Payload CMS values.

See `deploy/infisical/README.md` for the Vercel sync and DigitalOcean agent
workflow.

## Backend - Infisical `/backend`

Project: backend

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
PORT=3003

JWT_SECRET=replace-with-long-random-secret
RESOURCE_CREDENTIALS_SECRET=replace-with-long-random-secret

CORS_ALLOWED_ORIGINS=https://truerdp.com,https://dashboard.truerdp.com,https://admin.truerdp.com
WEB_BASE_URL=https://truerdp.com
DASHBOARD_BASE_URL=https://dashboard.truerdp.com
BACKEND_BASE_URL=https://api.truerdp.com

RESEND_API_KEY=
RESEND_FROM_EMAIL=TrueRDP <support@YOUR_DOMAIN>
RESEND_REPLY_TO_EMAIL=
RESEND_BASE_URL=
ADMIN_ALERT_EMAILS=

DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_DEFAULT_CURRENCY=USD
DODO_TAX_CATEGORY=

COINGATE_ENVIRONMENT=sandbox
COINGATE_API_TOKEN=
COINGATE_RECEIVE_CURRENCY=DO_NOT_CONVERT
COINGATE_PENDING_STATUS_POLL_ATTEMPTS=4
COINGATE_PENDING_STATUS_POLL_DELAY_MS=500

EXPIRY_REMINDER_SWEEP_INTERVAL_MINUTES=0
EXPIRY_REMINDER_SWEEP_DAYS_AHEAD=3
```

Backend notes:

- Use the Neon pooled connection string for `DATABASE_URL` when available.
- Keep `?sslmode=require` in the Neon URL.
- `CORS_ALLOWED_ORIGINS` must contain exact frontend origins, comma-separated,
  with `https://` and no trailing path.
- Set Dodo, CoinGate, and Resend values before enabling those flows in
  production.

## Shared - Infisical `/shared`

Use shared values for URLs that multiple projects consume:

```env
NEXT_PUBLIC_API_URL=https://api.truerdp.com
NEXT_PUBLIC_WEB_URL=https://truerdp.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.truerdp.com
NEXT_PUBLIC_ADMIN_URL=https://admin.truerdp.com
INTERNAL_API_URL=https://api.truerdp.com
PAYLOAD_PUBLIC_URL=https://cms.truerdp.com
CMS_INTERNAL_API_URL=https://cms.truerdp.com
```

Shared notes:

- `NEXT_PUBLIC_*` values are public after a frontend build.
- After changing any `NEXT_PUBLIC_*` value, redeploy the affected Vercel apps.

## Web - Infisical `/web` synced to Vercel

Project: `truerdp-web`

```env
CMS_INTERNAL_API_TOKEN=
CMS_REVALIDATE_SECRET=
NEXT_PUBLIC_TAWK_TO_PROPERTY_ID=69f19d041b71d51c3915ab58
NEXT_PUBLIC_TAWK_TO_WIDGET_ID=1jnbsqn3o
```

Web notes:

- `NEXT_PUBLIC_API_URL` must include `https://`.
- `NEXT_PUBLIC_DASHBOARD_URL` is used after checkout success.
- `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_DASHBOARD_URL`, and
  `NEXT_PUBLIC_ADMIN_URL` are used to allow safe post-login redirects.
- `PAYLOAD_PUBLIC_URL` points editors and app integrations at Payload CMS.
- `CMS_INTERNAL_API_URL` and `CMS_INTERNAL_API_TOKEN` allow server-side reads
  for draft content and managed email templates.
- `CMS_REVALIDATE_SECRET` must match Payload hooks that post to
  `https://truerdp.com/api/revalidate` and the manual draft URL secret.

## Dashboard - Infisical `/dashboard` synced to Vercel

Project: dashboard

```env
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
```

Dashboard notes:

- `NEXT_PUBLIC_API_URL` must include `https://`.
- `NEXT_PUBLIC_WEB_URL` controls the login redirect target. If it is missing,
  dashboard falls back to `http://localhost:3000`.

## Admin - Infisical `/admin` synced to Vercel

Project: admin

```env
# App-specific values can stay empty until needed.
```

Admin notes:

- `NEXT_PUBLIC_API_URL` must include `https://`.
- `NEXT_PUBLIC_WEB_URL` controls the login redirect target. If it is missing,
  admin falls back to `http://localhost:3000`.

## CMS - Infisical `/cms` synced to Vercel

Project: cms

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
PAYLOAD_SECRET=
CMS_INTERNAL_API_TOKEN=
CMS_REVALIDATE_SECRET=
```

CMS notes:

- If CMS and backend share the same Postgres database, keep `DATABASE_URL`
  intentionally identical in Infisical.
- `CMS_INTERNAL_API_TOKEN` and `CMS_REVALIDATE_SECRET` must match the values
  used by web/backend integrations.

## Redeploy Rule

After changing any `NEXT_PUBLIC_*` variable in Vercel, redeploy that project.
Next.js bakes public variables into the frontend build.
