"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { queryKeys } from "@/lib/query-keys"
import { dashboardPaths } from "@/lib/paths"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type TicketSummary = {
  id: number
  subject: string
  status: "open" | "closed"
  lastMessageAt: string | null
  createdAt: string
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-"
}

export default function SupportPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
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

  const createTicket = useMutation({
    mutationFn: () =>
      clientApi<{ ticket: TicketSummary }>("/support/tickets", {
        method: "POST",
        body: { subject, message },
      }),
    onSuccess: async () => {
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
            Track support requests and open a new ticket when you need help.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Create new ticket
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new ticket</DialogTitle>
              <DialogDescription>
                Send your request to the TrueRDP support team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Field>
                <FieldLabel>Subject</FieldLabel>
                <Input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Billing, instance access, renewal..."
                />
              </Field>
              <Field>
                <FieldLabel>Message</FieldLabel>
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Describe the issue."
                  className="min-h-32"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createTicket.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createTicket.mutate()}
                disabled={
                  createTicket.isPending ||
                  subject.trim().length < 3 ||
                  message.trim().length === 0
                }
              >
                Create ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead className="w-28">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading tickets...</TableCell>
              </TableRow>
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No tickets found.</TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono">#{ticket.id}</TableCell>
                  <TableCell className="min-w-56 font-medium">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ticket.status === "open" ? "default" : "outline"}
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(ticket.lastMessageAt ?? ticket.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={dashboardPaths.supportTicket(ticket.id)}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
