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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"

type CreateTicketDialogProps = {
  open: boolean
  userEmail: string
  userOptions: string[]
  subject: string
  message: string
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onUserEmailChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onMessageChange: (value: string) => void
  onCreate: () => void
}

export function CreateTicketDialog({
  open,
  userEmail,
  userOptions,
  subject,
  message,
  isPending,
  onOpenChange,
  onUserEmailChange,
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
            <FieldLabel>User email</FieldLabel>
            <Combobox
              items={userOptions}
              value={userEmail || null}
              onValueChange={(value) => onUserEmailChange(value ?? "")}
              disabled={userOptions.length === 0}
            >
              <ComboboxInput
                placeholder="Search user email"
                className="w-full"
                showTrigger={false}
                showClear
                disabled={userOptions.length === 0}
              />
              <ComboboxContent>
                <ComboboxList>
                  {(option) => (
                    <ComboboxItem key={option} value={option}>
                      {option}
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>No users found</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
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
              userEmail.trim().length === 0 ||
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
