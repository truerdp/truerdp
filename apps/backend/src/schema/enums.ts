import { pgEnum } from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["user", "operator", "admin"])

export const instanceStatusEnum = pgEnum("instance_status", [
  "pending",
  "provisioning",
  "active",
  "suspended",
  "expired",
  "termination_pending",
  "terminated",
  "failed",
])

export const serverStatusEnum = pgEnum("server_status", [
  "available",
  "assigned",
  "cleaning",
  "retired",
])

export const resourceStatusEnum = pgEnum("resource_status", [
  "active",
  "released",
])

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "confirmed",
  "failed",
])

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "processing",
  "completed",
  "cancelled",
])

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "unpaid",
  "paid",
  "expired",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "usdt_trc20",
  "dodo_checkout",
  "coingate_checkout",
])

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "flat"])
export const couponAppliesToEnum = pgEnum("coupon_applies_to", [
  "all",
  "new_purchase",
  "renewal",
])

export const purchaseKindEnum = pgEnum("purchase_kind", [
  "new_purchase",
  "renewal",
])

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "closed"])
export const senderTypeEnum = pgEnum("sender_type", ["user", "admin"])
export const instanceStatusActionEnum = pgEnum("instance_status_action", [
  "provision",
  "extend",
  "suspend",
  "unsuspend",
  "terminate",
])
