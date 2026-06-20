export type TicketSummary = {
  id: number
  subject: string
  status: TicketStatus
  lastMessageAt: string | null
  createdAt: string
}

export type TicketStatus = "open" | "answered" | "customer_replied" | "closed"

export function formatTicketStatus(status: TicketStatus) {
  if (status === "customer_replied") {
    return "Customer replied"
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getTicketStatusVariant(
  status: TicketStatus
): "default" | "secondary" | "outline" {
  if (status === "customer_replied") {
    return "secondary"
  }

  return status === "open" || status === "answered" ? "default" : "outline"
}

export function formatTicketDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-"
}
