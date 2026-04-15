import type { Route } from "next"

export const adminPaths = {
  overview: "/" as Route,
  instances: "/instances" as Route,
  transactions: "/transactions" as Route,
  expiredInstances: "/instances/expired" as Route,
} as const
