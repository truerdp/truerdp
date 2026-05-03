import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

import {
  instanceStatusEnum,
  resourceStatusEnum,
  serverStatusEnum,
} from "./enums"
import { orders } from "./orders"
import { plans } from "./plans"
import { users } from "./users"

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
