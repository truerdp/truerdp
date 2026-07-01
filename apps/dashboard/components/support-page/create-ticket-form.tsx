"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientApi } from "@workspace/api/client"

import { dashboardPaths } from "@/lib/paths"
import { queryKeys } from "@/lib/query-keys"
import type { TicketSummary } from "@/components/support-page/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { RichTextEditor } from "@workspace/ui/components/rich-text-editor"

type CreateTicketFormProps = {
  initialSubject?: string
  initialMessage?: string
}

export function CreateTicketForm({
  initialSubject = "",
  initialMessage = "",
}: CreateTicketFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState(initialSubject)
  const [message, setMessage] = useState(initialMessage)

  const hasPrefill =
    initialSubject.trim().length > 0 || initialMessage.trim().length > 0

  useEffect(() => {
    if (!hasPrefill) {
      return
    }

    void fetch("/support/prefill/clear", { method: "POST" })
  }, [hasPrefill])

  const createTicket = useMutation({
    mutationFn: () =>
      clientApi<{ ticket: TicketSummary }>("/support/tickets", {
        method: "POST",
        body: { subject, message },
      }),
    onSuccess: async (data) => {
      setSubject("")
      setMessage("")
      await queryClient.invalidateQueries({
        queryKey: queryKeys.supportTickets(),
      })
      toast.success("Ticket created")

      router.push(dashboardPaths.supportTicket(data.ticket.id))
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to create ticket")
    },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-4">
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
          <RichTextEditor
            value={message}
            onChange={setMessage}
            placeholder="Describe the issue."
            editorClassName="min-h-32"
          />
        </Field>
      </div>

      <div className="flex gap-3">
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
        <Button
          variant="outline"
          onClick={() => router.push(dashboardPaths.support)}
          disabled={createTicket.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
