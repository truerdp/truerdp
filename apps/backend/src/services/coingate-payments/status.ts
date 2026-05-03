export function mapCoinGateStatusToEventType(status: string) {
  const normalized = status.trim().toLowerCase()

  if (normalized === "paid") {
    return "payment.succeeded"
  }

  if (
    normalized === "canceled" ||
    normalized === "cancelled" ||
    normalized === "expired" ||
    normalized === "invalid"
  ) {
    return "payment.failed"
  }

  return "payment.processing"
}

export function isCoinGateTerminalStatus(status: string) {
  const normalized = status.trim().toLowerCase()

  return (
    normalized === "paid" ||
    normalized === "canceled" ||
    normalized === "cancelled" ||
    normalized === "expired" ||
    normalized === "invalid"
  )
}

export function getPendingStatusPollAttempts() {
  const raw = process.env.COINGATE_PENDING_STATUS_POLL_ATTEMPTS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : NaN

  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 4
}

export function getPendingStatusPollDelayMs() {
  const raw = process.env.COINGATE_PENDING_STATUS_POLL_DELAY_MS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : NaN

  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 500
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
