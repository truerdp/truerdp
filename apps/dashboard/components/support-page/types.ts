export type TicketSummary = {
  id: number
  subject: string
  status: "open" | "closed"
  lastMessageAt: string | null
  createdAt: string
}

export function formatTicketDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-"
}
