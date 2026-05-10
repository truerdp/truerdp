"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle03FreeIcons } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FieldDescription, FieldGroup } from "@workspace/ui/components/field"
import { webPaths } from "@/lib/paths"

export function VerifyEmailSuccessCard() {
  const searchParams = useSearchParams()
  const alreadyVerified = useMemo(
    () => searchParams.get("alreadyVerified") === "1",
    [searchParams]
  )
  const confettiTriggered = useRef(false)

  useEffect(() => {
    if (alreadyVerified) {
      return
    }

    if (confettiTriggered.current) return
    confettiTriggered.current = true

    // Trigger confetti animation
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [alreadyVerified])

  return (
    <main className="container mx-auto flex max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <HugeiconsIcon
              icon={CheckmarkCircle03FreeIcons}
              size={64}
              className="text-emerald-600 dark:text-emerald-400"
              strokeWidth={1.5}
            />
          </div>
          <CardTitle className="text-2xl">
            {alreadyVerified ? "Email already verified" : "Email verified!"}
          </CardTitle>
          <CardDescription>
            {alreadyVerified
              ? "Your email is already verified. You can log in and proceed to checkout."
              : "Your email has been successfully verified. You can now sign in to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldDescription className="text-center text-sm">
              {alreadyVerified
                ? "Sign in to continue with checkout or manage your RDP instances."
                : "Your TrueRDP account is all set and ready to go. Start exploring plans and managing your RDP instances."}
            </FieldDescription>
            <Link href={webPaths.login}>
              <Button type="button" className="w-full">
                Sign in to your account
              </Button>
            </Link>
            {alreadyVerified ? (
              <Link href={webPaths.plans}>
                <Button type="button" variant="secondary" className="w-full">
                  Browse plans
                </Button>
              </Link>
            ) : null}
            <FieldDescription className="text-center">
              Need help?{" "}
              <Link href={webPaths.contact} className="underline">
                Contact support
              </Link>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>
    </main>
  )
}
