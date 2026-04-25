import type { Route } from "next"

export const adminPaths = {
  overview: "/" as Route,
  instances: "/instances" as Route,
  instanceDetails: (instanceId: number) => `/instances/${instanceId}` as Route,
  users: "/users" as Route,
  plans: "/plans" as Route,
  content: "/content" as Route,
  auditLogs: "/audit-logs" as Route,
  coupons: "/coupons" as Route,
  support: "/support" as Route,
  supportTicket: (ticketId: number) => `/support/${ticketId}` as Route,
  servers: "/servers" as Route,
  invoices: "/invoices" as Route,
  transactions: "/transactions" as Route,
  expiredInstances: "/instances/expired" as Route,
  userDetails: (userId: number) => `/users/${userId}` as Route,
} as const
