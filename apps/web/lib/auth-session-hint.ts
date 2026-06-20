"use client"

import { useEffect, useSyncExternalStore } from "react"

const authSessionHintKey = "truerdp.authenticated"
const authSessionHintCookie = "truerdp_auth_hint"
const authSessionHintEvent = "truerdp:auth-session-hint"
const betterAuthCookieNames = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
]

function emitAuthSessionHintChange() {
  window.dispatchEvent(new Event(authSessionHintEvent))
}

function readAuthSessionHint() {
  if (typeof window === "undefined") {
    return false
  }

  if (window.localStorage.getItem(authSessionHintKey) === "1") {
    return true
  }

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0] ?? "")
    .some(
      (name) =>
        name === authSessionHintCookie || betterAuthCookieNames.includes(name)
    )
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(authSessionHintEvent, callback)

  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(authSessionHintEvent, callback)
  }
}

export function markAuthSessionLikelyPresent() {
  window.localStorage.setItem(authSessionHintKey, "1")
  document.cookie = `${authSessionHintCookie}=1; path=/; max-age=2592000; samesite=lax`
  emitAuthSessionHintChange()
}

export function clearAuthSessionHint() {
  window.localStorage.removeItem(authSessionHintKey)
  document.cookie = `${authSessionHintCookie}=; path=/; max-age=0; samesite=lax`
  emitAuthSessionHintChange()
}

export function useAuthSessionHint() {
  const hasSessionHint = useSyncExternalStore(
    subscribe,
    readAuthSessionHint,
    () => false
  )

  useEffect(() => {
    if (hasSessionHint !== readAuthSessionHint()) {
      emitAuthSessionHintChange()
    }
  }, [hasSessionHint])

  return hasSessionHint
}
