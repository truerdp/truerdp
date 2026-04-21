"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface AdminInvoiceSummary {
  id: number
  invoiceNumber: string
  status: "unpaid" | "paid" | "expired"
  totalAmount: number
  currency: string
  createdAt: string
  expiresAt: string
  paidAt: string | null
  transaction: {
    id: number | null
    reference: string | null
    status: "pending" | "confirmed" | "failed" | null
    method: "upi" | "usdt_trc20" | null
    createdAt: string | null
  }
  order: {
    id: number
    userId: number
    status: "pending_payment" | "processing" | "completed" | "cancelled"
  }
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  plan: {
    name: string
    durationDays: number
    kind: "new_purchase" | "renewal"
  }
}

export function useInvoices() {
  return useQuery<AdminInvoiceSummary[]>({
    queryKey: queryKeys.invoices(),
    queryFn: () => clientApi("/admin/invoices"),
  })
}
