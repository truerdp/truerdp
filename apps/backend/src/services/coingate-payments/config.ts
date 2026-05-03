type CoinGateAuthScheme = "token" | "bearer"

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

export function getCoinGateEnvironment() {
  const raw = process.env.COINGATE_ENVIRONMENT?.trim().toLowerCase()

  if (raw === "sandbox" || raw === "test") {
    return "sandbox"
  }

  if (raw === "live" || raw === "production") {
    return "live"
  }

  return process.env.NODE_ENV === "production" ? "live" : "sandbox"
}

export function getCoinGateApiBaseUrl() {
  if (getCoinGateEnvironment() === "sandbox") {
    return "https://api-sandbox.coingate.com/api/v2"
  }

  return "https://api.coingate.com/api/v2"
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

export function getReceiveCurrency() {
  const configured = process.env.COINGATE_RECEIVE_CURRENCY?.trim().toUpperCase()
  return configured && configured.length > 0 ? configured : "DO_NOT_CONVERT"
}

export function buildAuthHeader(apiKey: string, scheme: CoinGateAuthScheme) {
  if (scheme === "bearer") {
    return `Bearer ${apiKey}`
  }

  return `Token ${apiKey}`
}
