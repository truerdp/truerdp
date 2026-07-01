"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { clientApi } from "@workspace/api/client"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { TicketsTable } from "@/app/support/_components/tickets-table"
import { filterTickets, type TicketSummary } from "@/app/support/models"
import { queryKeys } from "@/lib/query-keys"
import { adminPaths } from "@/lib/paths"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

export default function AdminSupportPage() {
  const [search, setSearch] = useState("")
  const { data: tickets = [], isLoading } = useQuery<TicketSummary[]>({
    queryKey: queryKeys.supportTickets(),
    queryFn: () => clientApi("/admin/support/tickets"),
  })

  const filteredTickets = useMemo(
    () => filterTickets(tickets, search),
    [search, tickets]
  )



  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Search customer tickets and open threaded support conversations.
          </p>
        </div>
        <Button render={<Link href={adminPaths.supportNew} />}>
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Create new ticket
        </Button>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <label htmlFor="admin-support-search" className="text-sm font-medium">
          Search tickets
        </label>
        <Input
          id="admin-support-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by ticket, user, email, subject, or status"
        />
      </div>
      <TicketsTable isLoading={isLoading} tickets={filteredTickets} />
    </section>
  )
}
