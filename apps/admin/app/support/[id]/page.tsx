"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"
import { Badge } from "@workspace/ui/components/badge"
import { BackButton } from "@workspace/ui/components/back-button"
import { Button } from "@workspace/ui/components/button"
import {
  RichTextContent,
  RichTextEditor,
} from "@workspace/ui/components/rich-text-editor"
import { cn } from "@workspace/ui/lib/utils"
import { adminPaths } from "@/lib/paths"
import { queryKeys } from "@/lib/query-keys"
import { uploadSupportImage } from "@/lib/support-image-upload"
import {
  formatTicketStatus,
  getTicketStatusVariant,
  type TicketStatus,
} from "@/app/support/models"

type TicketDetail = {
  ticket: {
    id: number
    userId: number
    subject: string
    status: TicketStatus
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
    return (
      <div className="text-sm text-muted-foreground">Loading thread...</div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-sm text-destructive">Unable to load ticket.</div>
    )
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <BackButton
            render={<Link href={adminPaths.support} />}
            variant="outline"
          >
            Back to tickets
          </BackButton>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Ticket #{data.ticket.id}
            </h1>
            <Badge variant={getTicketStatusVariant(data.ticket.status)}>
              {formatTicketStatus(data.ticket.status)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <b>Subject:</b> {data.ticket.subject}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={adminPaths.userDetails(data.ticket.userId)}>
              {data?.messages[0]?.sender?.email ||
                `User #${data.ticket.userId}`}
            </Link>{" "}
            • Created at {formatDate(data.ticket.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={adminPaths.userDetailsSupportAction(
              data.ticket.userId,
              data.ticket.id,
              "profile"
            )}
          >
            <Button variant="outline">Update profile</Button>
          </Link>
          <Link
            href={adminPaths.userDetailsSupportAction(
              data.ticket.userId,
              data.ticket.id,
              "billing"
            )}
          >
            <Button variant="outline">Update billing</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() =>
              statusMutation.mutate(
                data.ticket.status === "closed" ? "reopen" : "close"
              )
            }
          >
            {data.ticket.status === "closed" ? "Reopen ticket" : "Close ticket"}
          </Button>
        </div>
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
                  <RichTextContent value={message.message} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-background p-3">
        <RichTextEditor
          value={reply}
          onChange={setReply}
          placeholder="Reply to customer..."
          editorClassName="min-h-32"
          enableImages
          uploadImage={uploadSupportImage}
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
