import type { Route } from "next"

export const dashboardPaths = {
  overview: "/" as Route,
  instances: "/instances" as Route,
  transactions: "/transactions" as Route,
  invoices: "/invoices" as Route,
  support: "/support" as Route,
  supportTicket: (ticketId: number) => `/support/${ticketId}` as Route,
  account: "/account" as Route,
  instanceDetail: (id: string | number) => `/instances/${id}` as Route,
  invoiceDetail: (id: string | number) => `/invoices/${id}` as Route,
} as const

export function isInstanceDetailPath(pathname: string) {
  return pathname.startsWith(`${dashboardPaths.instances}/`)
}
