import { sql } from "drizzle-orm"
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

import { users } from "./users.js"

export const cmsPages = pgTable(
  "cms_pages",
  {
    id: serial("id").primaryKey(),

    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    content: jsonb("content")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("cms_pages_slug_unique").on(table.slug),
    isPublishedIdx: index("cms_pages_is_published_idx").on(table.isPublished),
    updatedAtIdx: index("cms_pages_updated_at_idx").on(table.updatedAt),
  })
)

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: serial("id").primaryKey(),

    key: text("key").notNull(),
    subjectTemplate: text("subject_template").notNull(),
    htmlTemplate: text("html_template").notNull(),
    textTemplate: text("text_template"),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    keyUnique: uniqueIndex("email_templates_key_unique").on(table.key),
    isActiveIdx: index("email_templates_is_active_idx").on(table.isActive),
  })
)

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
