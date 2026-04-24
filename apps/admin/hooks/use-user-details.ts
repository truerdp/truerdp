"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface AdminUser360Details {
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: "user" | "operator" | "admin"
    createdAt: string
    updatedAt: string
  }
  summary: {
    totalOrders: number
    newPurchases: number
    renewals: number
    totalInvoices: number
    paidInvoices: number
    unpaidInvoices: number
    expiredInvoices: number
    totalTransactions: number
    confirmedTransactions: number
    pendingTransactions: number
    failedTransactions: number
    totalSpentCents: number
    outstandingCents: number
    currency: string
    activeInstances: number
    expiringSoonInstances: number
    expiredInstances: number
    terminatedInstances: number
    pendingInstances: number
    totalExtensions: number
    lastActivityAt: string | null
  }
  latestBillingDetails: {
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
  } | null
  latestBillingCapturedAt: string | null
  instances: Array<{
    id: number
    userId: number
    originOrderId: number
    planId: number
    status:
      | "pending"
      | "provisioning"
      | "active"
      | "expired"
      | "termination_pending"
      | "terminated"
      | "failed"
    startDate: string | null
    expiryDate: string | null
    terminatedAt: string | null
    provisionAttempts: number
    lastProvisionError: string | null
    createdAt: string
    updatedAt: string
    plan: {
      id: number
      name: string
      cpu: number
      ram: number
      storage: number
    } | null
    resource: {
      id: number
      username: string | null
      status: "active" | "released"
      assignedAt: string
      releasedAt: string | null
    } | null
    server: {
      id: number
      provider: string
      ipAddress: string
      status: "available" | "assigned" | "cleaning" | "retired"
    } | null
    extensionCount: number
    lastExtensionAt: string | null
    lastExtensionDays: number | null
    daysUntilExpiry: number | null
    daysSinceExpiry: number | null
    isExpiringSoon: boolean
  }>
  invoices: Array<{
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
  }>
  transactions: Array<{
    id: number
    userId: number
    amount: number
    method: "dodo_checkout" | "upi" | "usdt_trc20"
    status: "pending" | "confirmed" | "failed"
    createdAt: string
    confirmedAt: string | null
    reference: string | null
    failureReason: string | null
    kind: "new_purchase" | "renewal"
    order: {
      id: number
      status: "pending_payment" | "processing" | "completed" | "cancelled"
    }
    invoice: {
      id: number
      invoiceNumber: string
      status: "unpaid" | "paid" | "expired"
      totalAmount: number
      currency: string
      expiresAt: string
      paidAt: string | null
      createdAt: string
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
  }>
}

export function useUserDetails(userId: number) {
  return useQuery<AdminUser360Details>({
    queryKey: queryKeys.userDetails(userId),
    queryFn: () => clientApi(`/admin/users/${userId}`),
    enabled: !!userId,
  })
}
