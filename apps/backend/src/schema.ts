import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
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

export const paymentMethodEnum = pgEnum("payment_method", ["upi", "usdt_trc20"])

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "closed"])

export const senderTypeEnum = pgEnum("sender_type", ["user", "admin"])

/* ================= USERS ================= */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  role: roleEnum("role").default("user").notNull(),

  discountPercent: integer("discount_percent").default(0),
  discountFlat: integer("discount_flat").default(0),

  createdAt: timestamp("created_at").defaultNow(),
})

/* ================= SERVERS ================= */

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),

  ipAddress: text("ip_address").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(), // sensitive

  cpu: integer("cpu").notNull(),
  ram: integer("ram").notNull(),
  storage: integer("storage").notNull(),

  status: serverStatusEnum("status").default("available").notNull(),
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
})

/* ================= INSTANCES ================= */

export const instances = pgTable("instances", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  serverId: integer("server_id")
    // .notNull()
    .references(() => servers.id),

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

  createdAt: timestamp("created_at").defaultNow(),
})

/* ================= TRANSACTIONS ================= */

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  planId: integer("plan_id")
    .notNull()
    .references(() => plans.id),

  amount: integer("amount").notNull(),

  method: paymentMethodEnum("method").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),

  reference: text("reference"),

  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),

  instanceId: integer("instance_id").references(() => instances.id),
})

/* ================= SUPPORT ================= */

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  subject: text("subject").notNull(),

  status: ticketStatusEnum("status").default("open").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
})

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),

  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id),

  senderType: senderTypeEnum("sender_type").notNull(),

  message: text("message").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
})
