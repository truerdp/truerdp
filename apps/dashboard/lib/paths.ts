import type { Route } from "next"

export const dashboardPaths = {
  overview: "/" as Route,
  instances: "/instances" as Route,
  orders: "/orders" as Route,
  orderDetail: (id: string | number) => `/orders/${id}` as Route,
  transactions: "/transactions" as Route,
  transactionDetail: (id: string | number) => `/transactions/${id}` as Route,
  invoices: "/invoices" as Route,
  support: "/support" as Route,
  supportNew: "/support/new" as Route,
  supportTicket: (ticketId: number) => `/support/${ticketId}` as Route,
  account: "/account" as Route,
  instanceDetail: (id: string | number) => `/instances/${id}` as Route,
  invoiceDetail: (id: string | number) => `/invoices/${id}` as Route,
} as const

export function isInstanceDetailPath(pathname: string) {
  return pathname.startsWith(`${dashboardPaths.instances}/`)
}
