export const AUTH_TOKEN_CHANGED_EVENT = "auth-token-changed"

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem("token")
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem("token", token)
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT))
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("token")
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT))
}
