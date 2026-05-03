import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { clientApi } from "@workspace/api"

import { queryKeys } from "@/lib/query-keys"
import type { TicketSummary } from "@/components/support-page/types"
import { Button } from "@workspace/ui/components/button"
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

export function CreateTicketDialog() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

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
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger render={<Button />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
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
  )
}
