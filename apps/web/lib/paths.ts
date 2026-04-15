import type { Route } from "next"

export const webPaths = {
  home: "/" as Route,
  login: "/login" as Route,
  signup: "/signup" as Route,
  checkout: "/checkout" as Route,
  checkoutSuccess: "/checkout/success" as Route,
} as const
