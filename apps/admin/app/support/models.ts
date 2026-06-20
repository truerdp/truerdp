export type TicketSummary = {
  id: number
  userId: number
  subject: string
  status: TicketStatus
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  user: {
    firstName: string
    lastName: string
    email: string
  }
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

export function filterTickets(tickets: TicketSummary[], search: string) {
  const normalized = search.trim().toLowerCase()

  if (!normalized) {
    return tickets
  }

  return tickets.filter((ticket) =>
    [
      String(ticket.id),
      String(ticket.userId),
      ticket.subject,
      ticket.status,
      ticket.user.email,
      ticket.user.firstName,
      ticket.user.lastName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  )
}
