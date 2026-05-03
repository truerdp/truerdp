"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { webPaths } from "@/lib/paths"

type ForgotPasswordResponse = {
  status: boolean
  message: string
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setResetUrl(null)

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await clientApi<ForgotPasswordResponse>(
        "/api/auth/request-password-reset",
        {
          method: "POST",
          body: {
            email: email.trim(),
            redirectTo: `${window.location.origin}/reset-password`,
          },
        }
      )
      setMessage(response.message)
      setResetUrl(null)
      toast.success("Password reset requested")
    } catch (submitError) {
      const nextError =
        submitError instanceof Error
          ? submitError.message
          : "Unable to request password reset"
      setError(nextError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll generate a password reset
            link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={!!error && !message}>
                <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <FieldDescription>
                  For security, we use the same response whether an account
                  exists or not.
                </FieldDescription>
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>

              {message ? (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}

              {resetUrl ? (
                <Alert>
                  <AlertDescription>
                    Dev reset link:{" "}
                    <Link href={resetUrl} className="break-all underline">
                      {resetUrl}
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner data-icon="inline-start" />}
                  Send reset link
                </Button>
                <FieldDescription className="text-center">
                  Remembered it?{" "}
                  <Link href={webPaths.login} className="underline">
                    Back to login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
