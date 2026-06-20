import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { orders } from "./orders.js"
import { planPricing, plans } from "./plans.js"
import { users } from "./users.js"

export const cartItems = pgTable(
  "cart_items",
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
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("cart_items_user_id_idx").on(table.userId),
    planPricingIdIdx: index("cart_items_plan_pricing_id_idx").on(
      table.planPricingId
    ),
    userPricingUnique: uniqueIndex("cart_items_user_pricing_unique").on(
      table.userId,
      table.planPricingId
    ),
  })
)

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),
    planPricingId: integer("plan_pricing_id")
      .notNull()
      .references(() => planPricing.id),
    planName: text("plan_name").notNull(),
    planPriceUsdCents: integer("plan_price").notNull(),
    durationDays: integer("duration_days").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    planPricingIdIdx: index("order_items_plan_pricing_id_idx").on(
      table.planPricingId
    ),
  })
)
