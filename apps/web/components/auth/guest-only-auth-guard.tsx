"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useProfile } from "@/hooks/use-profile"
import { resolvePostAuthRedirect } from "@/lib/auth"

export function GuestOnlyAuthGuard({
  children,
  fallback = <div className="h-96 w-full" />,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileQuery = useProfile()
  const redirectTarget = resolvePostAuthRedirect(searchParams.get("redirect"))
  const isAuthenticated = !profileQuery.isError && Boolean(profileQuery.data)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (redirectTarget.startsWith("/")) {
      router.replace(redirectTarget)
      return
    }

    window.location.replace(redirectTarget)
  }, [isAuthenticated, redirectTarget, router])

  if (profileQuery.isLoading || isAuthenticated) {
    return fallback
  }

  return children
}
