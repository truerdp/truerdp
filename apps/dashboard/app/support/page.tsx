"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import { clientApi } from "@workspace/api"
import { CreateTicketDialog } from "@/components/support-page/create-ticket-dialog"
import { TicketsTable } from "@/components/support-page/tickets-table"
import type { TicketSummary } from "@/components/support-page/types"
import { Input } from "@workspace/ui/components/input"

export default function SupportPage() {
  const [search, setSearch] = useState("")
  const { data: tickets = [], isLoading } = useQuery<TicketSummary[]>({
    queryKey: queryKeys.supportTickets(),
    queryFn: () => clientApi("/support/tickets"),
  })

  const filteredTickets = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    if (!normalized) {
      return tickets
    }

    return tickets.filter((ticket) =>
      [String(ticket.id), ticket.subject, ticket.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
  }, [search, tickets])

  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Track support requests and open a new ticket when you need help.
          </p>
        </div>
        <CreateTicketDialog />
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <label htmlFor="support-search" className="text-sm font-medium">
          Search tickets
        </label>
        <Input
          id="support-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by ticket, subject, or status"
        />
      </div>

      <TicketsTable filteredTickets={filteredTickets} isLoading={isLoading} />
    </section>
  )
}
