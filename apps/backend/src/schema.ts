import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

/* ================= ENUMS ================= */

export const roleEnum = pgEnum("role", ["user", "operator", "admin"])

export const instanceStatusEnum = pgEnum("instance_status", [
  "pending",
  "provisioning",
  "active",
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

export const paymentMethodEnum = pgEnum("payment_method", ["upi", "usdt_trc20"])

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "flat"])

export const purchaseKindEnum = pgEnum("purchase_kind", [
  "new_purchase",
  "renewal",
])

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
  cpuName: text("cpu_name").default("Intel Xeon").notNull(),
  cpuThreads: integer("cpu_threads").default(2).notNull(),
  ram: integer("ram").notNull(),
  ramType: text("ram_type").default("DDR4").notNull(),
  storage: integer("storage").notNull(),
  storageType: text("storage_type").default("SSD").notNull(),
  bandwidth: text("bandwidth").default("2TB").notNull(),
  os: text("os").default("Windows").notNull(),
  osVersion: text("os_version").default("Windows Server 2022").notNull(),
  planType: text("plan_type").default("Dedicated").notNull(),
  portSpeed: text("port_speed").default("1Gbps").notNull(),
  setupFees: integer("setup_fees").default(0).notNull(),
  planLocation: text("plan_location").default("USA").notNull(),

  defaultPricingId: integer("default_pricing_id"),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

/* ================= PLAN PRICING ================= */

export const planPricing = pgTable(
  "plan_pricing",
  {
    id: serial("id").primaryKey(),

    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),

    durationDays: integer("duration_days").notNull(),
    price: integer("price").notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    planIdIdx: index("plan_pricing_plan_id_idx").on(table.planId),
    planDurationUnique: uniqueIndex("plan_pricing_plan_duration_unique").on(
      table.planId,
      table.durationDays
    ),
  })
)

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

    planPricingId: integer("plan_pricing_id")
      .notNull()
      .references(() => planPricing.id),

    kind: purchaseKindEnum("kind").default("new_purchase").notNull(),

    // Snapshot of the product the user purchased at checkout time.
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
    planPricingIdIdx: index("orders_plan_pricing_id_idx").on(
      table.planPricingId
    ),
    kindIdx: index("orders_kind_idx").on(table.kind),
    statusIdx: index("orders_status_idx").on(table.status),
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

/* ================= INSTANCES ================= */

export const instances = pgTable(
  "instances",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id),

    originOrderId: integer("origin_order_id")
      .notNull()
      .references(() => orders.id),

    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),

    status: instanceStatusEnum("status").default("pending").notNull(),

    startDate: timestamp("start_date"),
    expiryDate: timestamp("expiry_date"),
    terminatedAt: timestamp("terminated_at"),

    provisionAttempts: integer("provision_attempts").default(0).notNull(),
    lastProvisionError: text("last_provision_error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("instances_user_id_idx").on(table.userId),
    planIdIdx: index("instances_plan_id_idx").on(table.planId),
    statusIdx: index("instances_status_idx").on(table.status),
    expiryDateIdx: index("instances_expiry_date_idx").on(table.expiryDate),
    originOrderIdIdx: index("instances_origin_order_id_idx").on(
      table.originOrderId
    ),
  })
)

/* ================= SERVERS (INVENTORY) ================= */

export const servers = pgTable(
  "servers",
  {
    id: serial("id").primaryKey(),

    provider: text("provider").default("manual").notNull(),
    externalId: text("external_id"),

    ipAddress: text("ip_address").notNull(),
    cpu: integer("cpu").notNull(),
    ram: integer("ram").notNull(),
    storage: integer("storage").notNull(),

    status: serverStatusEnum("status").default("available").notNull(),

    lastAssignedAt: timestamp("last_assigned_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    ipAddressUnique: uniqueIndex("servers_ip_address_unique").on(
      table.ipAddress
    ),
    statusIdx: index("servers_status_idx").on(table.status),
    providerExternalIdIdx: index("servers_provider_external_id_idx").on(
      table.provider,
      table.externalId
    ),
  })
)

/* ================= RESOURCES (ASSIGNMENT) ================= */

export const resources = pgTable(
  "resources",
  {
    id: serial("id").primaryKey(),

    instanceId: integer("instance_id")
      .notNull()
      .references(() => instances.id),

    serverId: integer("server_id")
      .notNull()
      .references(() => servers.id),

    username: text("username"),
    passwordEncrypted: text("password_encrypted"),

    status: resourceStatusEnum("status").default("active").notNull(),

    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    releasedAt: timestamp("released_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    instanceUnique: uniqueIndex("resources_instance_id_unique").on(
      table.instanceId
    ),
    serverUnique: uniqueIndex("resources_server_id_unique")
      .on(table.serverId)
      .where(sql`${table.status} = 'active'`),
    statusIdx: index("resources_status_idx").on(table.status),
    instanceServerIdx: index("resources_instance_server_idx").on(
      table.instanceId,
      table.serverId
    ),
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

/* ================= PAYMENT WEBHOOK EVENTS ================= */

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: serial("id").primaryKey(),

    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    externalReference: text("external_reference"),

    status: text("status").default("received").notNull(),
    payload: jsonb("payload").notNull(),
    normalized: jsonb("normalized"),
    errorMessage: text("error_message"),

    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    providerEventUnique: uniqueIndex(
      "payment_webhook_events_provider_event_unique"
    ).on(table.provider, table.eventId),
    statusIdx: index("payment_webhook_events_status_idx").on(table.status),
    externalReferenceIdx: index("payment_webhook_events_external_ref_idx").on(
      table.externalReference
    ),
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
