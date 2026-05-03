import type { AdminUser360Details } from "@/hooks/use-user-details"

export type UserDetailsData = AdminUser360Details
export type UserSummary = AdminUser360Details["summary"]
export type UserDetailsUser = AdminUser360Details["user"]
export type UserInstance = AdminUser360Details["instances"][number]
export type UserInvoice = AdminUser360Details["invoices"][number]
export type UserTransaction = AdminUser360Details["transactions"][number]

export type InsightTone = "neutral" | "good" | "warning"

export interface Insight {
  title: string
  description: string
  tone: InsightTone
}
