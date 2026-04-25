import type { Route } from "next"

export const webPaths = {
  home: "/" as Route,
  login: "/login" as Route,
  signup: "/signup" as Route,
  forgotPassword: "/forgot-password" as Route,
  resetPassword: "/reset-password" as Route,
  checkoutReviewOrder: (orderId: number) =>
    `/checkout/${orderId}/review` as Route,
  checkoutOrder: (orderId: number) => `/checkout/${orderId}` as Route,
  checkoutSuccess: "/checkout/success" as Route,
  faq: "/faq" as Route,
  terms: "/terms" as Route,
  privacy: "/privacy" as Route,
  refundPolicy: "/refund-policy" as Route,
  contact: "/contact" as Route,
} as const
