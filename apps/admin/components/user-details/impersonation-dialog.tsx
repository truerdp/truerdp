"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Login03Icon } from "@hugeicons/core-free-icons"
import { clientApi } from "@workspace/api/client"
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

function getDashboardUrl() {
  return (
    process.env.NEXT_PUBLIC_DASHBOARD_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "/")
  ).replace(/\/$/, "")
}

export function ImpersonationDialog({
  userId,
  displayName,
}: {
  userId: number
  displayName: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    const normalizedReason = reason.trim()

    if (!normalizedReason) {
      setError("Reason for access is required.")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await clientApi(`/admin/users/${userId}/impersonations`, {
        method: "POST",
        body: {
          reason: normalizedReason,
          mode: "full",
        },
      })

      window.location.assign(getDashboardUrl())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start session.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" />}>
        <HugeiconsIcon icon={Login03Icon} strokeWidth={2} />
        Login as Customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login as Customer</DialogTitle>
          <DialogDescription>
            Start an audited support session for {displayName}. The customer
            password is never exposed.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field data-invalid={!!error && !reason.trim()}>
            <FieldLabel htmlFor="impersonation-reason">
              Reason for access
            </FieldLabel>
            <Textarea
              id="impersonation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={!!error && !reason.trim()}
              placeholder="Describe the support request, issue reproduction, or assisted action."
              rows={5}
            />
            <FieldDescription>
              This reason is stored with the audit log for the session.
            </FieldDescription>
            {!reason.trim() && error ? <FieldError>{error}</FieldError> : null}
          </Field>

          {error && reason.trim() ? <FieldError>{error}</FieldError> : null}
        </FieldGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <HugeiconsIcon icon={Login03Icon} strokeWidth={2} />
            Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
