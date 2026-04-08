import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core"

/* ================= ENUMS ================= */

export const roleEnum = pgEnum("role", ["user", "operator", "admin"])

export const serverStatusEnum = pgEnum("server_status", [
  "available",
  "reserved",
  "assigned",
])

export const instanceStatusEnum = pgEnum("instance_status", [
  "pending",
  "provisioning",
  "active",
  "expired",
  "termination_pending",
  "terminated",
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
  "paypal",
])

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "flat"])

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "closed"])
export const senderTypeEnum = pgEnum("sender_type", ["user", "admin"])

/* ================= USERS ================= */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").default("user").notNull(),

  // TODO: phase out later (replaced by coupons)
  discountPercent: integer("discount_percent").default(0),
  discountFlat: integer("discount_flat").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

/* ================= SERVERS ================= */

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),

  ipAddress: text("ip_address").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(), // TODO: encrypt at rest

  cpu: integer("cpu").notNull(),
  ram: integer("ram").notNull(),
  storage: integer("storage").notNull(),

  status: serverStatusEnum("status").default("available").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

/* ================= PLANS ================= */

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),

  cpu: integer("cpu").notNull(),
  ram: integer("ram").notNull(),
  storage: integer("storage").notNull(),

  price: integer("price").notNull(),
  durationDays: integer("duration_days").notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

/* ================= INSTANCES ================= */

export const instances = pgTable("instances", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  serverId: integer("server_id").references(() => servers.id),

  planId: integer("plan_id")
    .notNull()
    .references(() => plans.id),

  status: instanceStatusEnum("status").default("pending").notNull(),

  ipAddress: text("ip_address"),
  username: text("username"),
  password: text("password"),

  startDate: timestamp("start_date"),
  expiryDate: timestamp("expiry_date"),
  terminatedAt: timestamp("terminated_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

// RULE: Instances must ONLY be created AFTER invoice.status = "paid"

/* ================= ORDERS ================= */

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

    // Snapshot (critical)
    planName: text("plan_name").notNull(),
    planPrice: integer("plan_price").notNull(),
    durationDays: integer("duration_days").notNull(),

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
  })
)

/* ================= COUPONS ================= */

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),

    code: text("code").notNull(),
    type: couponTypeEnum("type").notNull(),
    value: integer("value").notNull(),

    maxUses: integer("max_uses"),
    expiresAt: timestamp("expires_at"),

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

/* ================= INVOICES ================= */

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),

    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),

    // IMPORTANT: generate safely (DB sequence or UUID, NOT count-based)
    invoiceNumber: text("invoice_number").notNull(),

    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").default(0).notNull(),
    totalAmount: integer("total_amount").notNull(),

    // discount must be <= subtotal
    // totalAmount must equal subtotal - discount

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

/* ================= COUPON USAGES ================= */

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

/* ================= TRANSACTIONS ================= */

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

    amount: integer("amount").notNull(),

    method: paymentMethodEnum("method").notNull(),
    gateway: text("gateway"),

    status: transactionStatusEnum("status").default("pending").notNull(),

    reference: text("reference"),
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
  })
)

/* ================= SUPPORT ================= */

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  subject: text("subject").notNull(),

  status: ticketStatusEnum("status").default("open").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),

  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id),

  senderType: senderTypeEnum("sender_type").notNull(),

  message: text("message").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})
