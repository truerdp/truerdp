"use client"

import { useEffect } from "react"
import { Spinner } from "@workspace/ui/components/spinner"
import { buildWebLoginUrl } from "@/lib/auth"
import { useProfile } from "@/hooks/use-profile"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const profileQuery = useProfile()

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (profileQuery.isError) {
      window.location.replace(buildWebLoginUrl(window.location.href))
    }
  }, [profileQuery.isError])

  if (profileQuery.isLoading) {
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
