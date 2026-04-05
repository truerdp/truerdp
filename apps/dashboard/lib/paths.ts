import type { Route } from "next"

export const dashboardPaths = {
  overview: "/" as Route,
  instances: "/instances" as Route,
  transactions: "/transactions" as Route,
  instanceDetail: (id: string | number) => `/instances/${id}` as Route,
} as const

export function isInstanceDetailPath(pathname: string) {
  return pathname.startsWith(`${dashboardPaths.instances}/`)
}
