"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError("Reset token is missing.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    try {
      setIsSubmitting(true)
      await clientApi("/api/auth/reset-password", {
        method: "POST",
        body: {
          token,
          newPassword: password,
        },
      })
      setIsComplete(true)
      toast.success("Password reset successfully")
      router.prefetch(webPaths.login)
    } catch (submitError) {
      const nextError =
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset password"
      setError(nextError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>
            Use at least 8 characters. Your reset link can only be used once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isComplete ? (
            <FieldGroup>
              <Alert>
                <AlertDescription>
                  Your password has been reset. You can now log in with the new
                  password.
                </AlertDescription>
              </Alert>
              <Button render={<Link href={webPaths.login} />}>Go to login</Button>
            </FieldGroup>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {!token ? (
                  <Alert>
                    <AlertDescription>
                      This reset link is missing a token. Request a new password
                      reset link to continue.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    disabled={isSubmitting || !token}
                    autoComplete="new-password"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm new password
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    disabled={isSubmitting || !token}
                    autoComplete="new-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </Field>

                {error ? <FieldError>{error}</FieldError> : null}

                <Field>
                  <Button type="submit" disabled={isSubmitting || !token}>
                    {isSubmitting && <Spinner data-icon="inline-start" />}
                    Reset password
                  </Button>
                  <FieldDescription className="text-center">
                    Need a new link?{" "}
                    <Link href={webPaths.forgotPassword} className="underline">
                      Request reset
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
