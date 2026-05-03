import { index, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

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
