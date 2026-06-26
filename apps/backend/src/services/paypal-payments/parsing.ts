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

export function objectFromUnknown(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

export function readNestedString(
  value: unknown,
  path: (string | number)[]
): string | null {
  let current = value

  for (const key of path) {
    if (typeof key === "number") {
      if (!Array.isArray(current)) {
        return null
      }

      current = current[key]
      continue
    }

    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null
    }

    current = (current as Record<string, unknown>)[key]
  }

  if (typeof current === "string" && current.trim()) {
    return current.trim()
  }

  if (typeof current === "number" && Number.isFinite(current)) {
    return String(current)
  }

  return null
}

export function extractRawBodyText(rawBody?: string | Buffer | undefined) {
  if (typeof rawBody === "string") {
    return rawBody
  }

  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString("utf8")
  }

  return ""
}

export function extractPayPalEventPayload(input: {
  payload: unknown
  rawBody?: string | Buffer | undefined
}) {
  const rawText = extractRawBodyText(input.rawBody)
  const parsedRaw = safeJsonParse(rawText)
  const rawObject = objectFromUnknown(parsedRaw)

  if (Object.keys(rawObject).length > 0) {
    return rawObject
  }

  return objectFromUnknown(input.payload)
}

export function formatPayPalAmount(amountMinor: number) {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error("PayPal amount must be a non-negative integer minor unit")
  }

  return (amountMinor / 100).toFixed(2)
}

export function toAmountMinor(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100)
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100)
    }
  }

  return null
}
