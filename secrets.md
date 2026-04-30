# Deployment Environment Variables

This file lists every environment variable used by the deployed apps. Do not
commit real secret values here.

## Backend - Railway

Project: backend

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
PORT=3003

JWT_SECRET=replace-with-long-random-secret
RESOURCE_CREDENTIALS_SECRET=replace-with-long-random-secret

AUTH_COOKIE_NAME=truerdp_session
AUTH_COOKIE_DOMAIN=.truerdp.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_MAX_AGE=604800

CORS_ALLOWED_ORIGINS=https://truerdp.com,https://dashboard.truerdp.com,https://admin.truerdp.com
WEB_BASE_URL=https://truerdp.com
DASHBOARD_BASE_URL=https://dashboard.truerdp.com
BACKEND_BASE_URL=https://api.truerdp.com

PASSWORD_RESET_EXPOSE_LINK=false

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
DODO_PRODUCT_MAP=

COINGATE_ENVIRONMENT=sandbox
COINGATE_API_TOKEN=
COINGATE_RECEIVE_CURRENCY=DO_NOT_CONVERT
COINGATE_PENDING_STATUS_POLL_ATTEMPTS=4
COINGATE_PENDING_STATUS_POLL_DELAY_MS=500

RAZORPAY_WEBHOOK_SECRET=
```

Backend notes:

- Use the Neon pooled connection string for `DATABASE_URL` when available.
- Keep `?sslmode=require` in the Neon URL.
- Use `AUTH_COOKIE_DOMAIN=.truerdp.com` after `api.truerdp.com`,
  `truerdp.com`, `dashboard.truerdp.com`, and `admin.truerdp.com` are all live.
- `CORS_ALLOWED_ORIGINS` must contain exact frontend origins, comma-separated,
  with `https://` and no trailing path.
- Set Dodo, CoinGate, Razorpay, and Resend values before enabling those flows in
  production.

## Web - Vercel

Project: `truerdp-web`

```env
NEXT_PUBLIC_API_URL=https://api.truerdp.com
NEXT_PUBLIC_WEB_URL=https://truerdp.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.truerdp.com
NEXT_PUBLIC_ADMIN_URL=https://admin.truerdp.com
INTERNAL_API_URL=

NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_STUDIO_URL=https://truerdp.com/studio
NEXT_PUBLIC_TAWK_TO_PROPERTY_ID=69f19d041b71d51c3915ab58
NEXT_PUBLIC_TAWK_TO_WIDGET_ID=1jnbsqn3o
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_VERSION=2026-03-01
SANITY_API_TOKEN=
SANITY_BROWSER_TOKEN=
SANITY_DRAFT_SECRET=
SANITY_REVALIDATE_SECRET=
```

Web notes:

- `NEXT_PUBLIC_API_URL` must include `https://`.
- `NEXT_PUBLIC_DASHBOARD_URL` is used after checkout success.
- `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_DASHBOARD_URL`, and
  `NEXT_PUBLIC_ADMIN_URL` are used to allow safe post-login redirects.
- `NEXT_PUBLIC_WEB_URL` is also used by Sanity Studio Live Preview to decide
  which frontend URL to show inside the preview frame.
- `NEXT_PUBLIC_SANITY_STUDIO_URL` is used by Sanity Visual Editing source maps.
  Use `/studio` locally and the full Studio URL in production.
- `SANITY_API_TOKEN` must be available in production for draft preview token
  validation and live draft reads. Use a server-only token with read access.
- `SANITY_BROWSER_TOKEN` is exposed to the browser by Sanity Live. Use the
  narrowest read-only browser-safe token you can, or leave it blank if browser
  live updates are not required.
- `SANITY_DRAFT_SECRET` is for the manual `/api/draft?secret=...&slug=...`
  preview entrypoint. Sanity Presentation live preview also sends
  `sanity-preview-secret`, which is validated with `SANITY_API_TOKEN`.
- `SANITY_REVALIDATE_SECRET` must match the secret configured on the Sanity
  webhook that posts to `https://truerdp.com/api/revalidate`.
- In Sanity project settings, add CORS origins for the deployed web origin and
  local web origin, for example `https://truerdp.com` and
  `http://localhost:3000`.

## Dashboard - Vercel

Project: dashboard

```env
NEXT_PUBLIC_API_URL=https://api.truerdp.com
NEXT_PUBLIC_WEB_URL=https://truerdp.com
INTERNAL_API_URL=
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
```

Dashboard notes:

- `NEXT_PUBLIC_API_URL` must include `https://`.
- `NEXT_PUBLIC_WEB_URL` controls the login redirect target. If it is missing,
  dashboard falls back to `http://localhost:3000`.

## Admin - Vercel

Project: admin

```env
NEXT_PUBLIC_API_URL=https://api.truerdp.com
NEXT_PUBLIC_WEB_URL=https://truerdp.com
INTERNAL_API_URL=
```

Admin notes:

- `NEXT_PUBLIC_API_URL` must include `https://`.
- `NEXT_PUBLIC_WEB_URL` controls the login redirect target. If it is missing,
  admin falls back to `http://localhost:3000`.

## Redeploy Rule

After changing any `NEXT_PUBLIC_*` variable in Vercel, redeploy that project.
Next.js bakes public variables into the frontend build.
