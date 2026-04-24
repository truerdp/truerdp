"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"

import { queryKeys } from "@/lib/query-keys"

export interface AdminUserSummary {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "user" | "operator" | "admin"
  createdAt: string
  updatedAt: string
  totalOrders: number
  totalInvoices: number
  unpaidInvoices: number
  totalTransactions: number
  confirmedTransactions: number
  activeInstances: number
  totalInstances: number
  totalSpentCents: number
  hasBillingProfile: boolean
  lastActivityAt: string | null
}

export function useUsers() {
  return useQuery<AdminUserSummary[]>({
    queryKey: queryKeys.users(),
    queryFn: () => clientApi("/admin/users"),
  })
}
