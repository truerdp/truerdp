export function getAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem("token")
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("token")
}

export function buildWebLoginUrl(redirectTarget: string) {
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
  const loginUrl = new URL("/login", webBaseUrl)
  loginUrl.searchParams.set("redirect", redirectTarget)
  return loginUrl.toString()
}
