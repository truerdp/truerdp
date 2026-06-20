"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"

import { queryKeys } from "@/lib/query-keys"

export interface ActiveImpersonation {
  active: true
  sessionId: number
  mode: "full"
  reason: string
  startedAt: string
  expiresAt: string
  secondsRemaining: number
  expiresSoon: boolean
  admin: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
  customer: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
}

export type ImpersonationState = ActiveImpersonation | { active: false }

export function useImpersonation() {
  return useQuery<ImpersonationState>({
    queryKey: queryKeys.impersonation(),
    queryFn: () => clientApi("/impersonation/current"),
    refetchInterval: 60 * 1000,
    retry: false,
  })
}
