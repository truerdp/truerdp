"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FieldDescription, FieldGroup } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { authClient } from "@/lib/auth-client"
import { webPaths } from "@/lib/paths"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams])
  const [isResending, setIsResending] = useState(false)

  async function handleResend() {
    if (!email) {
      toast.error("Missing email address")
      return
    }

    try {
      setIsResending(true)
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}${webPaths.login}`,
      })

      if (error) {
        throw new Error(error.message || "Unable to resend verification email")
      }

      toast.success("Verification email sent")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to resend verification email"
      )
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to your inbox. Please verify your email
            before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldDescription>
              {email ? `Email: ${email}` : "No email provided."}
            </FieldDescription>
            <Button
              type="button"
              disabled={isResending || !email}
              onClick={handleResend}
            >
              {isResending && <Spinner data-icon="inline-start" />}
              Resend verification email
            </Button>
            <FieldDescription className="text-center">
              Already verified? <Link href={webPaths.login}>Sign in</Link>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>
    </main>
  )
}
