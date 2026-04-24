"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

type InvoiceStatusFilter = "unpaid" | "paid" | "expired"
type TransactionStatusFilter = "none" | "pending" | "confirmed" | "failed"
type MethodFilter = "none" | "upi" | "usdt_trc20" | "dodo_checkout"

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
    method: "upi" | "usdt_trc20" | "dodo_checkout" | null
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

export interface AdminInvoiceListResponse {
  items: AdminInvoiceSummary[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface AdminInvoiceListQuery {
  page?: number
  pageSize?: number
  search?: string
  invoiceStatus?: InvoiceStatusFilter
  transactionStatus?: TransactionStatusFilter
  method?: MethodFilter
}

function buildInvoiceQueryString(query: AdminInvoiceListQuery) {
  const searchParams = new URLSearchParams()

  searchParams.set("page", String(query.page ?? 1))
  searchParams.set("pageSize", String(query.pageSize ?? 20))

  if (query.search?.trim()) {
    searchParams.set("search", query.search.trim())
  }

  if (query.invoiceStatus) {
    searchParams.set("invoiceStatus", query.invoiceStatus)
  }

  if (query.transactionStatus) {
    searchParams.set("transactionStatus", query.transactionStatus)
  }

  if (query.method) {
    searchParams.set("method", query.method)
  }

  return searchParams.toString()
}

export function useInvoices(query: AdminInvoiceListQuery) {
  return useQuery<AdminInvoiceListResponse>({
    queryKey: [...queryKeys.invoices(), query],
    queryFn: async () => {
      const response = await clientApi<
        AdminInvoiceListResponse | AdminInvoiceSummary[]
      >(`/admin/invoices?${buildInvoiceQueryString(query)}`)

      if (Array.isArray(response)) {
        const page = query.page ?? 1
        const pageSize = query.pageSize ?? 20
        const totalCount = response.length
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
        const clampedPage = Math.min(page, totalPages)
        const offset = (clampedPage - 1) * pageSize

        return {
          items: response.slice(offset, offset + pageSize),
          pagination: {
            page: clampedPage,
            pageSize,
            totalCount,
            totalPages,
          },
        }
      }

      return response
    },
  })
}
