"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface AdminTransaction {
  id: number
  userId: number
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
  amount: number
  method: "dodo_checkout" | "upi" | "usdt_trc20"
  status: "pending" | "confirmed" | "failed"
  createdAt: string
  reference: string
  kind: "new_purchase" | "renewal"
  invoice: {
    id: number
    invoiceNumber: string
    status: "unpaid" | "paid" | "cancelled" | "expired"
    totalAmount: number
    currency: string
    expiresAt: string
    paidAt: string | null
  }
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }
  pricing: {
    id: number
    durationDays: number
    priceUsdCents: number
  }
  instance: {
    id: number
    ipAddress: string | null
  } | null
}

export interface AdminTransactionListResponse {
  items: AdminTransaction[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface AdminTransactionListQuery {
  page?: number
  pageSize?: number
}

function buildTransactionQueryString(query: AdminTransactionListQuery) {
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(query.page ?? 1))
  searchParams.set("pageSize", String(query.pageSize ?? 20))
  return searchParams.toString()
}

export function useTransactions(query: AdminTransactionListQuery) {
  return useQuery<AdminTransactionListResponse>({
    queryKey: [...queryKeys.transactions(), query],
    queryFn: async () => {
      const response = await clientApi<
        AdminTransactionListResponse | AdminTransaction[]
      >(`/admin/transactions?${buildTransactionQueryString(query)}`)

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

      if (typeof response !== "object" || response == null) {
        throw new Error("Invalid transactions response from API")
      }

      const maybeItems = (response as Partial<AdminTransactionListResponse>)
        .items
      const safeItems = Array.isArray(maybeItems) ? maybeItems : []
      const page = query.page ?? 1
      const pageSize = query.pageSize ?? 20
      const totalCount =
        (response as Partial<AdminTransactionListResponse>).pagination
          ?.totalCount ?? safeItems.length
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
      const clampedPage = Math.min(page, totalPages)

      return {
        items: safeItems,
        pagination: {
          page: clampedPage,
          pageSize,
          totalCount,
          totalPages,
        },
      }
    },
  })
}
