"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface InvoiceSummary {
  id: number
  invoiceNumber: string
  status: "unpaid" | "paid" | "expired"
  totalAmount: number
  currency: string
  createdAt: string
  expiresAt: string | null
  paidAt: string | null
  transaction: {
    id: number | null
    reference: string | null
    status: "pending" | "confirmed" | "failed" | null
    method: "upi" | "usdt_trc20" | null
  }
  order: {
    id: number
    status: "pending_payment" | "processing" | "completed" | "cancelled"
  }
  plan: {
    name: string
    durationDays: number
    kind: "new_purchase" | "renewal"
  }
}

export function useInvoices() {
  return useQuery<InvoiceSummary[]>({
    queryKey: queryKeys.invoices(),
    queryFn: () => clientApi("/invoices"),
  })
}
