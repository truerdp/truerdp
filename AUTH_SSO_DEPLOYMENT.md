# Auth + Cookie SSO Deployment Checklist

This checklist validates one-login SSO across:

- `https://truerdp.com`
- `https://dashboard.truerdp.com`
- `https://admin.truerdp.com`

Assumption:

- API is served from `https://api.truerdp.com`

## Required Backend Env Values

Set these in backend production environment.

```env
JWT_SECRET=<strong-random-secret>
AUTH_COOKIE_NAME=truerdp_session
AUTH_COOKIE_DOMAIN=.truerdp.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_MAX_AGE=604800
CORS_ALLOWED_ORIGINS=https://truerdp.com,https://dashboard.truerdp.com,https://admin.truerdp.com
```

Notes:

- `AUTH_COOKIE_DOMAIN=.truerdp.com` is required for shared session across all subdomains.
- `AUTH_COOKIE_SECURE=true` is required in production HTTPS.
- `CORS_ALLOWED_ORIGINS` must be exact origins, comma-separated, with scheme.

## Required Frontend Env Values

Set these in app deployments.

- Web (`apps/web`): `NEXT_PUBLIC_API_URL=https://api.truerdp.com`
- Dashboard (`apps/dashboard`):
  - `NEXT_PUBLIC_API_URL=https://api.truerdp.com`
  - `NEXT_PUBLIC_WEB_URL=https://truerdp.com`
- Admin (`apps/admin`):
  - `NEXT_PUBLIC_API_URL=https://api.truerdp.com`
  - `NEXT_PUBLIC_WEB_URL=https://truerdp.com`

## Automated Smoke Test

Run from repo root:

```bash
chmod +x scripts/auth-sso-smoke.sh
EMAIL=user@truerdp.com \
PASSWORD='your-password' \
API_BASE_URL='https://api.truerdp.com' \
WEB_ORIGIN='https://truerdp.com' \
DASHBOARD_ORIGIN='https://dashboard.truerdp.com' \
ADMIN_ORIGIN='https://admin.truerdp.com' \
EXPECT_COOKIE_DOMAIN='.truerdp.com' \
./scripts/auth-sso-smoke.sh
```

What this script validates:

1. Login sets the auth cookie.
2. Same cookie works for API session checks initiated from web/dashboard/admin origins.
3. CORS headers include origin-specific `access-control-allow-origin` and `access-control-allow-credentials: true`.
4. Logout clears effective session.

## Manual Browser Validation

1. Open `https://truerdp.com` and login.
2. Open `https://dashboard.truerdp.com` in a new tab.
3. Confirm dashboard loads without re-login.
4. Open `https://admin.truerdp.com` in a new tab.
5. Confirm admin loads for an admin-role user.
6. Logout from any one app.
7. Refresh all three apps and confirm they are logged out.

## Security Verification

Use browser devtools on login response.

1. Verify `Set-Cookie` includes:

- `HttpOnly`
- `Secure`
- `SameSite=Lax` (or stricter if intentionally configured)
- `Domain=.truerdp.com`
- `Path=/`

2. Verify no auth token appears in `localStorage`.

3. Verify mutating API requests from non-allowlisted origins are rejected with `403`.

## Rollout Order

1. Deploy backend first.
2. Deploy web/dashboard/admin after backend is live.
3. Run automated smoke test.
4. Run browser validation.
5. Monitor 401/403 rates for 30 to 60 minutes.

## Rollback Plan

If sign-in regression appears:

1. Revert frontend bundle to previous known-good release.
2. Keep backend online.
3. If needed, restore prior backend auth behavior from last stable tag.
4. Re-run smoke test after rollback.
