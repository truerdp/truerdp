import type { Route } from "next"

export const webPaths = {
  home: "/" as Route,
  login: "/login" as Route,
  signup: "/signup" as Route,
  checkoutReviewOrder: (orderId: number) =>
    `/checkout/${orderId}/review` as Route,
  checkoutOrder: (orderId: number) => `/checkout/${orderId}` as Route,
  checkoutSuccess: "/checkout/success" as Route,
} as const
