"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { adminPaths } from "@/lib/paths"
import { queryKeys } from "@/lib/query-keys"

type TicketDetail = {
  ticket: {
    id: number
    userId: number
    subject: string
    status: "open" | "closed"
    createdAt: string
    updatedAt: string
  }
  messages: Array<{
    id: number
    senderType: "user" | "admin"
    senderUserId: number | null
    message: string
    createdAt: string
    sender: {
      firstName: string
      lastName: string
      email: string
      role: string
    } | null
  }>
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function AdminSupportTicketPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const ticketId = Number(params.id)
  const [reply, setReply] = useState("")
  const { data, isLoading, error } = useQuery<TicketDetail>({
    queryKey: queryKeys.supportTicket(ticketId),
    queryFn: () => clientApi(`/admin/support/tickets/${ticketId}`),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  })

  const replyMutation = useMutation({
    mutationFn: () =>
      clientApi(`/admin/support/tickets/${ticketId}/reply`, {
        method: "POST",
        body: { message: reply },
      }),
    onSuccess: async () => {
      setReply("")
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.supportTicket(ticketId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets() }),
      ])
    },
    onError: (replyError: Error) => {
      toast.error(replyError.message || "Unable to send reply")
    },
  })

  const statusMutation = useMutation({
    mutationFn: (action: "close" | "reopen") =>
      clientApi(`/admin/support/tickets/${ticketId}/${action}`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.supportTicket(ticketId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets() }),
      ])
    },
  })

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading thread...</div>
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Unable to load ticket.</div>
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={adminPaths.support}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to tickets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Ticket #{data.ticket.id}
            </h1>
            <Badge variant={data.ticket.status === "open" ? "default" : "outline"}>
              {data.ticket.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.ticket.subject} • User #{data.ticket.userId}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            statusMutation.mutate(
              data.ticket.status === "open" ? "close" : "reopen"
            )
          }
        >
          {data.ticket.status === "open" ? "Close ticket" : "Reopen ticket"}
        </Button>
      </div>

      <div className="flex-1 rounded-lg border bg-muted/20 p-3 sm:p-5">
        <div className="flex flex-col gap-3">
          {data.messages.map((message) => {
            const isAdmin = message.senderType === "admin"
            const senderName = message.sender
              ? `${message.sender.firstName} ${message.sender.lastName}`.trim()
              : isAdmin
                ? "Admin"
                : "Customer"

            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  isAdmin ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[min(32rem,85%)] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    isAdmin
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border bg-background"
                  )}
                >
                  <div className="mb-1 text-xs opacity-75">
                    {isAdmin ? "Admin" : senderName || "Customer"} •{" "}
                    {formatDate(message.createdAt)}
                  </div>
                  <p className="whitespace-pre-wrap leading-6">{message.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-background p-3">
        <Textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Reply to customer..."
          className="min-h-28"
        />
        <div className="mt-3 flex justify-end">
          <Button
            onClick={() => replyMutation.mutate()}
            disabled={!reply.trim() || replyMutation.isPending}
          >
            Send reply
          </Button>
        </div>
      </div>
    </section>
  )
}
