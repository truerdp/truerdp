"use client"

import { useEffect } from "react"
import { Spinner } from "@workspace/ui/components/spinner"
import { buildWebLoginUrl, clearAuthToken, getAuthToken } from "@/lib/auth"
import { useProfile } from "@/hooks/use-profile"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = getAuthToken()
  const profileQuery = useProfile()

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (!token) {
      window.location.replace(buildWebLoginUrl(window.location.href))
    }
  }, [token])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (profileQuery.isError) {
      clearAuthToken()
      window.location.replace(buildWebLoginUrl(window.location.href))
    }
  }, [profileQuery.isError])

  if (!token || profileQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return <>{children}</>
}
