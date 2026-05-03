import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

import { senderTypeEnum, ticketStatusEnum } from "./enums"
import { users } from "./users"

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
  senderUserId: integer("sender_user_id").references(() => users.id),
  message: text("message").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})
