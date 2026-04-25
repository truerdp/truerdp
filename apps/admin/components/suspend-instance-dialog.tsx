"use client"

import { useEffect, useState } from "react"
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
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  useSuspendInstance,
  useUnsuspendInstance,
} from "@/hooks/use-suspend-instance"

interface SuspendInstanceDialogProps {
  instanceId: number
  mode: "suspend" | "unsuspend"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: "button" | "none"
}

export function SuspendInstanceDialog({
  instanceId,
  mode,
  open: controlledOpen,
  onOpenChange,
  trigger = "button",
}: SuspendInstanceDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [reason, setReason] = useState("")
  const suspendInstance = useSuspendInstance()
  const unsuspendInstance = useUnsuspendInstance()
  const mutation = mode === "suspend" ? suspendInstance : unsuspendInstance
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const isPending =
    mutation.isPending && mutation.variables?.instanceId === instanceId
  const isSuspend = mode === "suspend"
  const error =
    reason.trim().length > 0 && reason.trim().length < 3
      ? "Reason must be at least 3 characters."
      : null

  useEffect(() => {
    if (!open) {
      setReason("")
    }
  }, [open])

  async function submit() {
    if (error || reason.trim().length === 0) {
      return
    }

    await mutation.mutateAsync({
      instanceId,
      reason: reason.trim(),
    })
    setReason("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === "button" ? (
        <DialogTrigger
          render={
            <Button size="sm" variant={isSuspend ? "outline" : "default"} />
          }
        >
          {isSuspend ? "Suspend" : "Undo suspension"}
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSuspend ? "Suspend instance" : "Undo suspension"}
          </DialogTitle>
          <DialogDescription>
            {isSuspend
              ? "Suspend access while keeping the assigned server attached."
              : "Restore the instance based on its current expiry date."}
          </DialogDescription>
        </DialogHeader>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={`suspend-reason-${instanceId}`}>
            Reason
          </FieldLabel>
          <Textarea
            id={`suspend-reason-${instanceId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add the operational reason for this action."
            disabled={isPending}
            aria-invalid={!!error}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isSuspend ? "destructive" : "default"}
            onClick={() => void submit()}
            disabled={isPending || reason.trim().length < 3}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {isSuspend ? "Suspend" : "Undo suspension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
