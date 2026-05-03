import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
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

type CreateTicketDialogProps = {
  open: boolean
  userId: string
  subject: string
  message: string
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onUserIdChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onMessageChange: (value: string) => void
  onCreate: () => void
}

export function CreateTicketDialog({
  open,
  userId,
  subject,
  message,
  isPending,
  onOpenChange,
  onUserIdChange,
  onSubjectChange,
  onMessageChange,
  onCreate,
}: CreateTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            Open a support thread on behalf of a customer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field>
            <FieldLabel>User ID</FieldLabel>
            <Input
              type="number"
              min={1}
              value={userId}
              onChange={(event) => onUserIdChange(event.target.value)}
              placeholder="Customer user id"
            />
          </Field>
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Input
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              placeholder="Billing, instance access, renewal..."
            />
          </Field>
          <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder="Initial support note."
              className="min-h-32"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={
              isPending ||
              Number(userId) <= 0 ||
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

