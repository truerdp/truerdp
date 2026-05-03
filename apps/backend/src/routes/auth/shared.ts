import { createHash } from "node:crypto"

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "truerdp_session"

function getCookieSameSite() {
  const value = (process.env.AUTH_COOKIE_SAME_SITE ?? "lax").toLowerCase()

  if (value === "strict" || value === "none") {
    return value
  }

  return "lax"
}

export function getAuthCookieConfig() {
  return {
    path: "/",
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    httpOnly: true,
    sameSite: getCookieSameSite() as "strict" | "lax" | "none",
    secure:
      process.env.AUTH_COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
    maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE ?? 60 * 60 * 24 * 7),
  }
}

export function getAuthCookieClearConfig() {
  return {
    path: "/",
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    sameSite: getCookieSameSite() as "strict" | "lax" | "none",
    secure:
      process.env.AUTH_COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
  }
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function buildResetPasswordUrl(token: string) {
  const configured =
    process.env.WEB_BASE_URL?.trim() || "http://localhost:3000"
  const url = new URL("/reset-password", configured)
  url.searchParams.set("token", token)
  return url.toString()
}

export function shouldExposeDevResetLink() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.PASSWORD_RESET_EXPOSE_LINK === "true"
  )
}

