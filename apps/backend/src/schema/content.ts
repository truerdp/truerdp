import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

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

export const impersonationSessions = pgTable(
  "impersonation_sessions",
  {
    id: serial("id").primaryKey(),

    token: text("token").notNull(),
    adminUserId: integer("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: integer("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: text("mode").notNull().default("full"),
    reason: text("reason").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    endedAt: timestamp("ended_at"),
    endedReason: text("ended_reason"),
    lastSeenAt: timestamp("last_seen_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    tokenUnique: uniqueIndex("impersonation_sessions_token_unique").on(
      table.token
    ),
    adminUserIdx: index("impersonation_sessions_admin_user_id_idx").on(
      table.adminUserId
    ),
    targetUserIdx: index("impersonation_sessions_target_user_id_idx").on(
      table.targetUserId
    ),
    activeLookupIdx: index("impersonation_sessions_active_lookup_idx").on(
      table.token,
      table.endedAt,
      table.expiresAt
    ),
  })
)
