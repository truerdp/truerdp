import { clientApi } from "@workspace/api"

export function buildLoginUrl(redirectTarget: string) {
  const loginUrl = new URL("/login", window.location.origin)
  loginUrl.searchParams.set("redirect", redirectTarget)
  return loginUrl.toString()
}

function parseOrigin(value: string | undefined) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getAllowedRedirectOrigins(currentOrigin: string) {
  const allowed = new Set<string>([currentOrigin])
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
  ]

  for (const url of configuredOrigins) {
    const origin = parseOrigin(url)

    if (origin) {
      allowed.add(origin)
    }
  }

  const currentUrl = new URL(currentOrigin)
  const isLocalHost =
    currentUrl.hostname === "localhost" || currentUrl.hostname === "127.0.0.1"

  if (isLocalHost && process.env.NODE_ENV !== "production") {
    const host = currentUrl.hostname
    allowed.add(`http://${host}:3000`)
    allowed.add(`http://${host}:3001`)
    allowed.add(`http://${host}:3002`)
  }

  return allowed
}

export function resolvePostAuthRedirect(redirectTarget: string | null) {
  const fallback = "/"

  if (!redirectTarget) {
    return fallback
  }

  if (redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")) {
    return redirectTarget
  }

  if (typeof window === "undefined") {
    return fallback
  }

  try {
    const candidate = new URL(redirectTarget)

    if (!["http:", "https:"].includes(candidate.protocol)) {
      return fallback
    }

    const allowedOrigins = getAllowedRedirectOrigins(window.location.origin)

    if (!allowedOrigins.has(candidate.origin)) {
      return fallback
    }

    if (candidate.origin === window.location.origin) {
      return `${candidate.pathname}${candidate.search}${candidate.hash}`
    }

    return candidate.toString()
  } catch {
    return fallback
  }
}

export async function logout() {
  await clientApi("/auth/logout", {
    method: "POST",
  })
}
