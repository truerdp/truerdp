export type TicketSummary = {
  id: number
  userId: number
  subject: string
  status: "open" | "closed"
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  user: {
    firstName: string
    lastName: string
    email: string
  }
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

