import type { CoinGateOrderResponse } from "./shared.js"
import {
  buildAuthHeader,
  getCoinGateApiBaseUrl,
  getEnv,
  getPendingStatusPollAttempts,
  getPendingStatusPollDelayMs,
  isCoinGateTerminalStatus,
  objectFromUnknown,
  safeJsonParse,
  sleep,
} from "./shared.js"

export async function coinGateRequest<T>(input: {
  path: string
  method?: "GET" | "POST"
  body?: Record<string, unknown> | null
}) {
  const apiKey = getEnv("COINGATE_API_TOKEN")
  const url = `${getCoinGateApiBaseUrl()}${input.path}`
  const authSchemes = ["token", "bearer"] as const
  let latestAuthError: string | null = null

  for (const scheme of authSchemes) {
    const response = await fetch(url, {
      method: input.method ?? (input.body ? "POST" : "GET"),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(apiKey, scheme),
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
    })

    const rawText = await response.text()
    const parsedBody = safeJsonParse(rawText)

    if (response.ok) {
      return parsedBody as T
    }

    const errorMessage =
      (parsedBody &&
      typeof parsedBody === "object" &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : "") ||
      rawText ||
      `HTTP ${response.status}`

    if (response.status === 401 || response.status === 403) {
      latestAuthError = errorMessage
      continue
    }

    throw new Error(
      `CoinGate API request failed (${response.status}): ${errorMessage}`
    )
  }

  throw new Error(
    `CoinGate API authorization failed: ${latestAuthError ?? "Unauthorized"}`
  )
}

export async function getCoinGateOrderById(orderId: number) {
  const response = await coinGateRequest<
    {
      order?: CoinGateOrderResponse
      data?: CoinGateOrderResponse | { order?: CoinGateOrderResponse }
    } & CoinGateOrderResponse
  >({
    path: `/orders/${orderId}`,
    method: "GET",
  })

  const topLevel = objectFromUnknown(response)
  const nestedData = objectFromUnknown(topLevel.data)
  const nestedOrder = objectFromUnknown(topLevel.order ?? nestedData.order)
  const candidate =
    Object.keys(nestedOrder).length > 0
      ? nestedOrder
      : Object.keys(nestedData).length > 0
        ? nestedData
        : topLevel

  if (Object.keys(candidate).length === 0) {
    throw new Error(`CoinGate order ${orderId} returned an empty response`)
  }

  return candidate as CoinGateOrderResponse
}

export async function pollCoinGateOrderUntilTerminal(orderId: number) {
  let latest = await getCoinGateOrderById(orderId)
  const attempts = getPendingStatusPollAttempts()
  const delayMs = getPendingStatusPollDelayMs()

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = (latest.status ?? "").toString().trim().toLowerCase()

    if (isCoinGateTerminalStatus(status)) {
      return latest
    }

    if (delayMs > 0) {
      await sleep(delayMs)
    }

    latest = await getCoinGateOrderById(orderId)
  }

  return latest
}
