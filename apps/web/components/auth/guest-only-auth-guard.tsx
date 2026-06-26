"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useProfile } from "@/hooks/use-profile"
import { canProfileUseRedirect, resolvePostAuthRedirect } from "@/lib/auth"

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
  const requestedRedirect = searchParams.get("redirect")
  const redirectTarget = resolvePostAuthRedirect(requestedRedirect)
  const isAuthenticated = !profileQuery.isError && Boolean(profileQuery.data)
  const canUseRedirect = canProfileUseRedirect({
    redirectTarget: requestedRedirect,
    role: profileQuery.data?.role,
  })

  useEffect(() => {
    if (!isAuthenticated || !canUseRedirect) {
      return
    }

    if (redirectTarget.startsWith("/")) {
      router.replace(redirectTarget)
      return
    }

    window.location.replace(redirectTarget)
  }, [canUseRedirect, isAuthenticated, redirectTarget, router])

  if (profileQuery.isLoading || (isAuthenticated && canUseRedirect)) {
    return fallback
  }

  return children
}
