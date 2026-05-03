import type { Route } from "next"

export const webPaths = {
  home: "/" as Route,
  plans: "/plans" as Route,
  planCategory: (category: string) =>
    `/plans/${encodeURIComponent(category.toLowerCase().replaceAll(" ", "-"))}` as Route,
  login: "/login" as Route,
  signup: "/signup" as Route,
  verifyEmail: "/verify-email" as Route,
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

export const blogPaths = {
  index: "/blog" as Route,
  post: (slug: string) => `/blog/${encodeURIComponent(slug)}` as Route,
  category: (slug: string) =>
    `/blog/category/${encodeURIComponent(slug)}` as Route,
  tag: (slug: string) => `/blog/tag/${encodeURIComponent(slug)}` as Route,
  search: "/blog/search" as Route,
  rss: "/blog/rss.xml" as Route,
} as const
