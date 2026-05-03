"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { Input } from "@workspace/ui/components/input"
import { CreateTicketDialog } from "@/app/support/_components/create-ticket-dialog"
import { TicketsTable } from "@/app/support/_components/tickets-table"
import { filterTickets, type TicketSummary } from "@/app/support/models"
import { queryKeys } from "@/lib/query-keys"

export default function AdminSupportPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const { data: tickets = [], isLoading } = useQuery<TicketSummary[]>({
    queryKey: queryKeys.supportTickets(),
    queryFn: () => clientApi("/admin/support/tickets"),
  })

  const filteredTickets = useMemo(
    () => filterTickets(tickets, search),
    [search, tickets]
  )

  const createTicket = useMutation({
    mutationFn: () =>
      clientApi<{ ticket: TicketSummary }>("/admin/support/tickets", {
        method: "POST",
        body: {
          userId: Number(userId),
          subject,
          message,
        },
      }),
    onSuccess: async () => {
      setUserId("")
      setSubject("")
      setMessage("")
      setCreateOpen(false)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets(),
      })
      toast.success("Ticket created")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to create ticket")
    },
  })

  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Search customer tickets and open threaded support conversations.
          </p>
        </div>
        <CreateTicketDialog
          open={createOpen}
          userId={userId}
          subject={subject}
          message={message}
          isPending={createTicket.isPending}
          onOpenChange={setCreateOpen}
          onUserIdChange={setUserId}
          onSubjectChange={setSubject}
          onMessageChange={setMessage}
          onCreate={() => createTicket.mutate()}
        />
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
