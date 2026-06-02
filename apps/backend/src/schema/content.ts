import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./users.js"

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: serial("id").primaryKey(),

    adminUserId: integer("admin_user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id"),
    reason: text("reason").notNull(),
    beforeState: jsonb("before_state").$type<Record<string, unknown> | null>(),
    afterState: jsonb("after_state").$type<Record<string, unknown> | null>(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    adminUserIdx: index("admin_audit_logs_admin_user_id_idx").on(
      table.adminUserId
    ),
    entityIdx: index("admin_audit_logs_entity_idx").on(
      table.entityType,
      table.entityId
    ),
    actionIdx: index("admin_audit_logs_action_idx").on(table.action),
    createdAtIdx: index("admin_audit_logs_created_at_idx").on(table.createdAt),
  })
)
