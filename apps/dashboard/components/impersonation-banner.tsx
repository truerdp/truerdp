"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, LogoutIcon } from "@hugeicons/core-free-icons"
import { clientApi } from "@workspace/api/client"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { useImpersonation } from "@/hooks/use-impersonation"
import { queryKeys } from "@/lib/query-keys"

function getAdminUserUrl(customerId: number) {
  const adminBase =
    process.env.NEXT_PUBLIC_ADMIN_URL ??
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3002"
      : "/admin")

  return `${adminBase.replace(/\/$/, "")}/users/${customerId}`
}

function formatDateTime(value: string) {
  const formatted = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))

  return `${formatted} UTC`
}

function formatName(user: {
  firstName: string
  lastName: string
  email: string
}) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email
}

export function ImpersonationBanner() {
  const impersonationQuery = useImpersonation()
  const queryClient = useQueryClient()
  const [isExiting, setIsExiting] = useState(false)
  const context = impersonationQuery.data

  if (!context?.active) {
    return null
  }

  async function exitImpersonation() {
    if (!context?.active) {
      return
    }

    try {
      setIsExiting(true)
      await clientApi("/impersonation/current", { method: "DELETE" })
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile() })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.impersonation(),
      })
      window.location.assign(getAdminUserUrl(context.customer.id))
    } finally {
      setIsExiting(false)
    }
  }

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            <span className="font-medium">
              You are currently viewing this account as support staff.
            </span>
            {context.expiresSoon ? (
              <Badge variant="secondary">Expires in 5 minutes</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>Customer: {formatName(context.customer)}</span>
            <span>Mode: Full Impersonation</span>
            <span>Started At: {formatDateTime(context.startedAt)}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exitImpersonation}
          disabled={isExiting}
          className="self-start bg-background lg:self-auto"
        >
          <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
          Exit Impersonation
        </Button>
      </div>
    </div>
  )
}
