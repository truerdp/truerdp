import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

import { roleEnum } from "./enums.js"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: text("name").default("User").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: roleEnum("role").default("user").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})
