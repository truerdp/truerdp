"use client"

import { useEffect } from "react"
import { Spinner } from "@workspace/ui/components/spinner"
import { useProfile } from "@/hooks/use-profile"
import { buildWebLoginUrl } from "@/lib/auth"

const allowedRoles = new Set(["admin", "superadmin", "manager", "support"])

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const profileQuery = useProfile()
  const role = String(profileQuery.data?.role ?? "").toLowerCase()
  const isRoleAllowed = allowedRoles.has(role)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (profileQuery.isError || (profileQuery.data && !isRoleAllowed)) {
      window.location.replace(buildWebLoginUrl(window.location.href))
    }
  }, [isRoleAllowed, profileQuery.data, profileQuery.isError])

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data || !isRoleAllowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return <>{children}</>
}
