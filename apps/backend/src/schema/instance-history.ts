import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

import { instanceStatusActionEnum, instanceStatusEnum } from "./enums"
import { instances } from "./instances"
import { users } from "./users"

export const instanceStatusEvents = pgTable(
  "instance_status_events",
  {
    id: serial("id").primaryKey(),

    instanceId: integer("instance_id")
      .notNull()
      .references(() => instances.id),

    adminUserId: integer("admin_user_id")
      .notNull()
      .references(() => users.id),

    action: instanceStatusActionEnum("action").notNull(),
    reason: text("reason").notNull(),
    fromStatus: instanceStatusEnum("from_status").notNull(),
    toStatus: instanceStatusEnum("to_status").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    instanceIdIdx: index("instance_status_events_instance_id_idx").on(
      table.instanceId
    ),
    adminUserIdIdx: index("instance_status_events_admin_user_id_idx").on(
      table.adminUserId
    ),
    createdAtIdx: index("instance_status_events_created_at_idx").on(
      table.createdAt
    ),
  })
)

export const instanceExtensions = pgTable(
  "instance_extensions",
  {
    id: serial("id").primaryKey(),

    instanceId: integer("instance_id")
      .notNull()
      .references(() => instances.id),

    extendedByUserId: integer("extended_by_user_id")
      .notNull()
      .references(() => users.id),

    previousExpiryDate: timestamp("previous_expiry_date").notNull(),
    newExpiryDate: timestamp("new_expiry_date").notNull(),
    daysExtended: integer("days_extended").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    instanceIdIdx: index("instance_extensions_instance_id_idx").on(
      table.instanceId
    ),
    extendedByUserIdIdx: index(
      "instance_extensions_extended_by_user_id_idx"
    ).on(table.extendedByUserId),
    createdAtIdx: index("instance_extensions_created_at_idx").on(
      table.createdAt
    ),
  })
)
