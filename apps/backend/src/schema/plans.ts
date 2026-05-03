import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

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
  isFeatured: boolean("is_featured").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
})

export const planPricing = pgTable(
  "plan_pricing",
  {
    id: serial("id").primaryKey(),

    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),

    durationDays: integer("duration_days").notNull(),
    priceUsdCents: integer("price").notNull(),

    dodoProductId: text("dodo_product_id"),
    dodoSyncStatus: text("dodo_sync_status", {
      enum: ["pending", "synced", "failed"],
    })
      .default("pending")
      .notNull(),
    dodoSyncError: text("dodo_sync_error"),
    dodoSyncedAt: timestamp("dodo_synced_at"),

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
