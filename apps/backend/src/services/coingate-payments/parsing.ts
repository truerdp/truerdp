export function safeJsonParse(text: string) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function stringifyUnknown(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

export function toAmountMajor(amountMinor: number) {
  return Number((amountMinor / 100).toFixed(2))
}

export function toAmountMinor(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100)
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100)
    }
  }

  return null
}

export function extractStringValue(
  source: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = source[key]

    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string")
      if (typeof first === "string" && first.trim().length > 0) {
        return first.trim()
      }
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

export function objectFromUnknown(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function parseRawBodyToObject(rawBody: string): Record<string, unknown> {
  const trimmed = rawBody.trim()

  if (!trimmed) {
    return {}
  }

  const asJson = safeJsonParse(trimmed)
  if (asJson && typeof asJson === "object" && !Array.isArray(asJson)) {
    return asJson as Record<string, unknown>
  }

  const params = new URLSearchParams(trimmed)
  const parsed: Record<string, unknown> = {}

  params.forEach((value, key) => {
    if (key in parsed) {
      const existing = parsed[key]
      if (Array.isArray(existing)) {
        existing.push(value)
        parsed[key] = existing
      } else {
        parsed[key] = [existing, value]
      }
      return
    }

    parsed[key] = value
  })

  return parsed
}

export function extractCallbackPayload(input: {
  payload: unknown
  rawBody?: string | Buffer | undefined
}) {
  const parsedPayload = objectFromUnknown(input.payload)
  if (Object.keys(parsedPayload).length > 0) {
    return parsedPayload
  }

  const raw = input.rawBody
  if (typeof raw === "string") {
    return parseRawBodyToObject(raw)
  }

  if (Buffer.isBuffer(raw)) {
    return parseRawBodyToObject(raw.toString("utf8"))
  }

  return {}
}

export function isCoinGateValidationError(err: unknown) {
  return err instanceof Error && err.message.includes("(422)")
}
