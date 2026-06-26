export function getEnv(key: string, required = true) {
  const value = process.env[key]

  if (!value || !value.trim()) {
    if (required) {
      throw new Error(`Missing required env: ${key}`)
    }

    return ""
  }

  return value.trim()
}

export function getPayPalEnvironment() {
  const raw = process.env.PAYPAL_ENVIRONMENT?.trim().toLowerCase()

  if (raw === "sandbox" || raw === "test") {
    return "sandbox"
  }

  if (raw === "live" || raw === "production") {
    return "live"
  }

  return process.env.NODE_ENV === "production" ? "live" : "sandbox"
}

export function getPayPalApiBaseUrl() {
  if (getPayPalEnvironment() === "sandbox") {
    return "https://api-m.sandbox.paypal.com"
  }

  return "https://api-m.paypal.com"
}

export function getBackendBaseUrl() {
  const configured = process.env.BACKEND_BASE_URL?.trim()
  return configured && configured.length > 0
    ? configured
    : "http://localhost:3003"
}

export function getWebBaseUrl() {
  const configured = process.env.WEB_BASE_URL?.trim()
  return configured && configured.length > 0
    ? configured
    : "http://localhost:3000"
}
