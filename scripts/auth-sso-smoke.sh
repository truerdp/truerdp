#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.truerdp.com}"
WEB_ORIGIN="${WEB_ORIGIN:-https://truerdp.com}"
DASHBOARD_ORIGIN="${DASHBOARD_ORIGIN:-https://dashboard.truerdp.com}"
ADMIN_ORIGIN="${ADMIN_ORIGIN:-https://admin.truerdp.com}"
AUTH_COOKIE_NAME="${AUTH_COOKIE_NAME:-truerdp_session}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/truerdp-sso-cookie-jar.txt}"
EMAIL="${EMAIL:-}"
PASSWORD="${PASSWORD:-}"
EXPECT_COOKIE_DOMAIN="${EXPECT_COOKIE_DOMAIN:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Missing credentials. Set EMAIL and PASSWORD." >&2
  echo "Example:" >&2
  echo "  EMAIL=user@truerdp.com PASSWORD=secret ./scripts/auth-sso-smoke.sh" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required but not installed" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

login_headers="$tmpdir/login-headers.txt"
login_body="$tmpdir/login-body.json"
logout_headers="$tmpdir/logout-headers.txt"
logout_body="$tmpdir/logout-body.json"

rm -f "$COOKIE_JAR"

echo "1) Logging in from WEB origin: $WEB_ORIGIN"
login_code="$(curl -sS \
    -X POST "$API_BASE_URL/auth/login" \
    -H "Origin: $WEB_ORIGIN" \
    -H "Content-Type: application/json" \
    --cookie-jar "$COOKIE_JAR" \
    --cookie "$COOKIE_JAR" \
    --data "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    -D "$login_headers" \
    -o "$login_body" \
    -w "%{http_code}")"

if [[ "$login_code" != "200" ]]; then
  echo "Login failed with status $login_code" >&2
  cat "$login_body" >&2
  exit 1
fi

if ! grep -qi "set-cookie: ${AUTH_COOKIE_NAME}=" "$login_headers"; then
  echo "Expected Set-Cookie for ${AUTH_COOKIE_NAME} not found" >&2
  cat "$login_headers" >&2
  exit 1
fi

if [[ -n "$EXPECT_COOKIE_DOMAIN" ]]; then
  if ! grep -qi "set-cookie: ${AUTH_COOKIE_NAME}=.*domain=${EXPECT_COOKIE_DOMAIN}" "$login_headers"; then
    echo "Set-Cookie did not contain expected domain ${EXPECT_COOKIE_DOMAIN}" >&2
    cat "$login_headers" >&2
    exit 1
  fi
fi

check_session_from_origin() {
  local origin="$1"
  local label="$2"
  local headers_file="$tmpdir/${label}-session-headers.txt"
  local body_file="$tmpdir/${label}-session-body.json"

  echo "2) Checking session from ${label} origin: ${origin}"

  local code
  code="$(curl -sS \
      "$API_BASE_URL/auth/session" \
      -H "Origin: $origin" \
      --cookie "$COOKIE_JAR" \
      -D "$headers_file" \
      -o "$body_file" \
      -w "%{http_code}")"

  if [[ "$code" != "200" ]]; then
    echo "Session check from ${label} failed with status $code" >&2
    cat "$body_file" >&2
    exit 1
  fi

  if ! grep -qi "access-control-allow-origin: ${origin}" "$headers_file"; then
    echo "CORS allow-origin header mismatch for ${label}" >&2
    cat "$headers_file" >&2
    exit 1
  fi

  if ! grep -qi "access-control-allow-credentials: true" "$headers_file"; then
    echo "CORS allow-credentials missing for ${label}" >&2
    cat "$headers_file" >&2
    exit 1
  fi

  if ! grep -q '"user"' "$body_file"; then
    echo "Session payload missing user object for ${label}" >&2
    cat "$body_file" >&2
    exit 1
  fi
}

check_session_from_origin "$WEB_ORIGIN" "web"
check_session_from_origin "$DASHBOARD_ORIGIN" "dashboard"
check_session_from_origin "$ADMIN_ORIGIN" "admin"

echo "3) Logging out"
logout_code="$(curl -sS \
    -X POST "$API_BASE_URL/auth/logout" \
    -H "Origin: $WEB_ORIGIN" \
    -H "Content-Type: application/json" \
    --cookie "$COOKIE_JAR" \
    --cookie-jar "$COOKIE_JAR" \
    --data "{}" \
    -D "$logout_headers" \
    -o "$logout_body" \
    -w "%{http_code}")"

if [[ "$logout_code" != "200" ]]; then
  echo "Logout failed with status $logout_code" >&2
  cat "$logout_body" >&2
  exit 1
fi

echo "4) Verifying session is gone"
post_logout_code="$(curl -sS \
    "$API_BASE_URL/auth/session" \
    -H "Origin: $DASHBOARD_ORIGIN" \
    --cookie "$COOKIE_JAR" \
    -o "$tmpdir/post-logout-session-body.json" \
    -w "%{http_code}")"

if [[ "$post_logout_code" != "401" ]]; then
  echo "Expected 401 after logout but got $post_logout_code" >&2
  cat "$tmpdir/post-logout-session-body.json" >&2
  exit 1
fi

echo "SUCCESS: Cross-subdomain auth cookie flow is working."
