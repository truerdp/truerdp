import type { Route } from "next"

export const adminPaths = {
  overview: "/" as Route,
  instances: "/instances" as Route,
  instanceDetails: (instanceId: number) => `/instances/${instanceId}` as Route,
  users: "/users" as Route,
  plans: "/plans" as Route,
  auditLogs: "/audit-logs" as Route,
  webhookEvents: "/webhook-events" as Route,
  coupons: "/coupons" as Route,
  support: "/support" as Route,
  supportNew: "/support/new" as Route,
  supportTicket: (ticketId: number) => `/support/${ticketId}` as Route,
  servers: "/servers" as Route,
  orders: "/orders" as Route,
  orderDetails: (orderId: number) => `/orders/${orderId}` as Route,
  invoices: "/invoices" as Route,
  invoiceDetails: (invoiceId: number) => `/invoices/${invoiceId}` as Route,
  transactions: "/transactions" as Route,
  transactionDetails: (transactionId: number) =>
    `/transactions/${transactionId}` as Route,
  expiredInstances: "/instances/expired" as Route,
  userDetails: (userId: number) => `/users/${userId}` as Route,
  userDetailsSupportAction: (
    userId: number,
    ticketId: number,
    action: "profile" | "billing"
  ) =>
    `/users/${userId}?ticket=${ticketId}${
      action === "billing" ? "&tab=billing#billing-profile" : "#account-metadata"
    }` as Route,
  account: "/account" as Route,
} as const
