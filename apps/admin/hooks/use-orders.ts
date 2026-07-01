"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"
import { queryKeys } from "@/lib/query-keys"

export type OrderStatusFilter =
  | "pending_payment"
  | "processing"
  | "completed"
  | "cancelled"
export type InvoiceStatusFilter = "none" | "unpaid" | "paid" | "expired"
type OrderInvoiceStatus = Exclude<InvoiceStatusFilter, "none">
export type OrderKindFilter = "new_purchase" | "renewal"

export interface AdminOrderSummary {
  id: number
  userId: number
  kind: OrderKindFilter
  status: OrderStatusFilter
  billingDetails: AdminOrderBillingDetails | null
  createdAt: string
  updatedAt: string
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
    durationDays: number
    priceUsdCents: number
  }
  invoice: {
    id: number
    invoiceNumber: string | null
    status: OrderInvoiceStatus | null
    totalAmount: number | null
    currency: string | null
    expiresAt: string | null
    paidAt: string | null
  } | null
  instance: {
    id: number
    status: string
  } | null
  user: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
}

export interface AdminOrderBillingDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string | null
  taxId: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

export interface AdminOrderListResponse {
  items: AdminOrderSummary[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface AdminOrderListQuery {
  page?: number
  pageSize?: number
  search?: string
  orderStatus?: OrderStatusFilter
  invoiceStatus?: InvoiceStatusFilter
  kind?: OrderKindFilter
}

function buildOrderQueryString(query: AdminOrderListQuery) {
  const searchParams = new URLSearchParams()

  searchParams.set("page", String(query.page ?? 1))
  searchParams.set("pageSize", String(query.pageSize ?? 20))

  if (query.search?.trim()) {
    searchParams.set("search", query.search.trim())
  }

  if (query.orderStatus) {
    searchParams.set("orderStatus", query.orderStatus)
  }

  if (query.invoiceStatus) {
    searchParams.set("invoiceStatus", query.invoiceStatus)
  }

  if (query.kind) {
    searchParams.set("kind", query.kind)
  }

  return searchParams.toString()
}

export function useOrders(query: AdminOrderListQuery) {
  return useQuery<AdminOrderListResponse>({
    queryKey: [...queryKeys.orders(), query],
    queryFn: () =>
      clientApi(`/admin/orders?${buildOrderQueryString(query)}`),
  })
}

export function useOrder(id: string | number, enabled = true) {
  return useQuery<AdminOrderSummary>({
    queryKey: queryKeys.order(id),
    queryFn: () => clientApi(`/admin/orders/${id}`),
    enabled,
  })
}
