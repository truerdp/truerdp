"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { useExtendInstance } from "@/hooks/use-extend-instance"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

interface ExtendInstanceDialogProps {
  instanceId: number
  expiryDate: string | null | undefined
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

export default function ExtendInstanceDialog({
  instanceId,
  expiryDate,
}: ExtendInstanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState("1")
  const [validationError, setValidationError] = useState<string | null>(null)
  const extendInstance = useExtendInstance()

  const isPending =
    extendInstance.isPending &&
    extendInstance.variables?.instanceId === instanceId

  const errorMessage = useMemo(() => {
    return (
      validationError ||
      (extendInstance.isError ? extendInstance.error.message : null)
    )
  }, [extendInstance.error?.message, extendInstance.isError, validationError])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (nextOpen) {
      setDays("1")
      setValidationError(null)
      return
    }

    if (!isPending) {
      setValidationError(null)
    }
  }

  const handleConfirm = async () => {
    const parsedDays = Number(days)

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setValidationError("Days must be greater than 0")
      return
    }

    setValidationError(null)

    try {
      await extendInstance.mutateAsync({
        instanceId,
        days: parsedDays,
      })

      setOpen(false)
    } catch {
      // Error state is handled by the mutation object.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" disabled={isPending} />}
      >
        Extend
      </DialogTrigger>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Extend Instance</DialogTitle>
          <DialogDescription>
            Update the expiry date for this instance without changing its
            status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-3xl border bg-muted/30 px-4 py-3 text-sm">
            <div className="text-muted-foreground">Current expiry date</div>
            <div className="mt-1 font-medium">{formatDate(expiryDate)}</div>
          </div>

          <Field>
            <FieldLabel htmlFor={`extend-days-${instanceId}`}>
              Days to extend
            </FieldLabel>
            <FieldContent>
              <Input
                id={`extend-days-${instanceId}`}
                type="number"
                min={1}
                step={1}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                disabled={isPending}
                aria-invalid={errorMessage ? true : undefined}
              />
              <FieldError>{errorMessage}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isPending} />}
          >
            Cancel
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                Extending...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
