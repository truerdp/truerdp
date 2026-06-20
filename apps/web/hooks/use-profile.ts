"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"
import {
  clearAuthSessionHint,
  useAuthSessionHint,
} from "@/lib/auth-session-hint"
import type { OrderBillingDetails } from "@/hooks/use-order"

export interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "admin" | "user" | "operator"
  createdAt: string
  billingDetails: OrderBillingDetails | null
}

function isSessionFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("unauthorized") ||
    message.includes("invalid session") ||
    message.includes("session")
  )
}

export function useProfile(options?: { enabled?: boolean }) {
  const hasSessionHint = useAuthSessionHint()
  const enabled = options?.enabled ?? hasSessionHint
  const query = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => clientApi("/profile"),
    enabled,
    retry: false,
  })

  useEffect(() => {
    if (!enabled || !query.isError || !isSessionFailure(query.error)) {
      return
    }

    clearAuthSessionHint()
  }, [enabled, query.error, query.isError])

  return query
}
