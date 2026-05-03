import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import {
  couponAppliesToEnum,
  couponTypeEnum,
  invoiceStatusEnum,
  paymentMethodEnum,
  transactionStatusEnum,
} from "./enums.js"
import { instances } from "./instances.js"
import { orders } from "./orders.js"
import { users } from "./users.js"

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),

    code: text("code").notNull(),
    type: couponTypeEnum("type").notNull(),
    value: integer("value").notNull(),
    appliesTo: couponAppliesToEnum("applies_to").default("all").notNull(),

    maxUses: integer("max_uses"),
    expiresAt: timestamp("expires_at"),

    dodoDiscountId: text("dodo_discount_id"),
    dodoSyncStatus: text("dodo_sync_status", {
      enum: ["pending", "synced", "failed"],
    })
      .default("pending")
      .notNull(),
    dodoSyncError: text("dodo_sync_error"),
    dodoSyncedAt: timestamp("dodo_synced_at"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex("coupons_code_unique").on(table.code),
  })
)

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),

    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),

    invoiceNumber: text("invoice_number").notNull(),

    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").default(0).notNull(),
    totalAmount: integer("total_amount").notNull(),

    currency: text("currency").default("USD").notNull(),
    couponId: integer("coupon_id").references(() => coupons.id),

    status: invoiceStatusEnum("status").default("unpaid").notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    paidAt: timestamp("paid_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    orderIdUnique: uniqueIndex("invoices_order_id_unique").on(table.orderId),
    invoiceNumberUnique: uniqueIndex("invoices_invoice_number_unique").on(
      table.invoiceNumber
    ),
    statusIdx: index("invoices_status_idx").on(table.status),
    expiresAtIdx: index("invoices_expires_at_idx").on(table.expiresAt),
  })
)

export const couponUsages = pgTable(
  "coupon_usages",
  {
    id: serial("id").primaryKey(),

    couponId: integer("coupon_id")
      .notNull()
      .references(() => coupons.id),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id),

    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    couponIdIdx: index("coupon_usages_coupon_id_idx").on(table.couponId),
    userIdIdx: index("coupon_usages_user_id_idx").on(table.userId),
    invoiceIdIdx: index("coupon_usages_invoice_id_idx").on(table.invoiceId),
    couponUserUnique: uniqueIndex("coupon_usages_coupon_user_unique").on(
      table.couponId,
      table.userId
    ),
  })
)

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id),

    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id),

    instanceId: integer("instance_id").references(() => instances.id),

    amount: integer("amount").notNull(),

    method: paymentMethodEnum("method").notNull(),
    gateway: text("gateway"),

    status: transactionStatusEnum("status").default("pending").notNull(),

    reference: text("reference"),
    idempotencyKey: text("idempotency_key"),
    failureReason: text("failure_reason"),
    metadata: jsonb("metadata"),

    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    invoiceIdIdx: index("transactions_invoice_id_idx").on(table.invoiceId),
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
    instanceIdIdx: index("transactions_instance_id_idx").on(table.instanceId),
    statusIdx: index("transactions_status_idx").on(table.status),
    referenceUnique: uniqueIndex("transactions_reference_unique").on(
      table.reference
    ),
    idempotencyKeyUnique: uniqueIndex("transactions_idempotency_key_unique").on(
      table.idempotencyKey
    ),
  })
)
