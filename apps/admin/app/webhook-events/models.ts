export type WebhookEventStatus = "received" | "processed" | "ignored" | "failed"

export type WebhookEventProvider = "dodo" | "coingate" | "mock"

export type WebhookEventItem = {
  id: number
  provider: WebhookEventProvider
  eventId: string
  eventType: string
  externalReference: string | null
  status: WebhookEventStatus
  errorMessage: string | null
  processedAt: string | null
  createdAt: string
}

export type WebhookEventResponse = {
  items: WebhookEventItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export function buildWebhookEventSearchParams(params: {
  page: number
  pageSize: number
  status?: string
  provider?: string
}) {
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(params.page))
  searchParams.set("pageSize", String(params.pageSize))

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status)
  }

  if (params.provider && params.provider !== "all") {
    searchParams.set("provider", params.provider)
  }

  return searchParams
}
