import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

import { purchaseKindEnum, orderStatusEnum } from "./enums"
import { planPricing, plans } from "./plans"
import { users } from "./users"

export type OrderBillingDetails = {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string | null
  taxId: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id),

    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),

    planPricingId: integer("plan_pricing_id")
      .notNull()
      .references(() => planPricing.id),

    renewalInstanceId: integer("renewal_instance_id"),

    kind: purchaseKindEnum("kind").default("new_purchase").notNull(),

    planName: text("plan_name").notNull(),
    planPriceUsdCents: integer("plan_price").notNull(),
    durationDays: integer("duration_days").notNull(),
    billingDetails: jsonb("billing_details").$type<OrderBillingDetails>(),

    status: orderStatusEnum("status").default("pending_payment").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    planIdIdx: index("orders_plan_id_idx").on(table.planId),
    planPricingIdIdx: index("orders_plan_pricing_id_idx").on(
      table.planPricingId
    ),
    renewalInstanceIdIdx: index("orders_renewal_instance_id_idx").on(
      table.renewalInstanceId
    ),
    kindIdx: index("orders_kind_idx").on(table.kind),
    statusIdx: index("orders_status_idx").on(table.status),
  })
)
