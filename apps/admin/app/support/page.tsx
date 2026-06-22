"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"
import { Input } from "@workspace/ui/components/input"
import { CreateTicketDialog } from "@/app/support/_components/create-ticket-dialog"
import { TicketsTable } from "@/app/support/_components/tickets-table"
import { useUsers } from "@/hooks/use-users"
import { filterTickets, type TicketSummary } from "@/app/support/models"
import { queryKeys } from "@/lib/query-keys"

export default function AdminSupportPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const { data: users = [] } = useUsers()
  const { data: tickets = [], isLoading } = useQuery<TicketSummary[]>({
    queryKey: queryKeys.supportTickets(),
    queryFn: () => clientApi("/admin/support/tickets"),
  })

  const userEmailOptions = useMemo(
    () => users.map((user) => user.email),
    [users]
  )

  const selectedUser = useMemo(
    () => users.find((user) => user.email === userEmail) ?? null,
    [userEmail, users]
  )

  const filteredTickets = useMemo(
    () => filterTickets(tickets, search),
    [search, tickets]
  )

  const createTicket = useMutation({
    mutationFn: () =>
      clientApi<{ ticket: TicketSummary }>("/admin/support/tickets", {
        method: "POST",
        body: {
          userId: selectedUser?.id ?? 0,
          subject,
          message,
        },
      }),
    onSuccess: async () => {
      setUserEmail("")
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
          <p className="text-sm text-muted-foreground">
            Search customer tickets and open threaded support conversations.
          </p>
        </div>
        <CreateTicketDialog
          open={createOpen}
          userEmail={userEmail}
          userOptions={userEmailOptions}
          subject={subject}
          message={message}
          isPending={createTicket.isPending}
          onOpenChange={setCreateOpen}
          onUserEmailChange={setUserEmail}
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
