import { randomUUID } from "node:crypto"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import {
  instances,
  invoices,
  orders,
  plans,
  transactions,
} from "../schema.js"
import { calculatePrice } from "./pricing.js"

const PAYMENT_WINDOW_HOURS = 24

export const supportedPaymentMethodSchema = z.enum(["upi", "usdt_trc20"])

export type SupportedPaymentMethod = z.infer<
  typeof supportedPaymentMethodSchema
>

const billingTransactionMetadataSchema = z.object({
  purchaseType: z.enum(["new_purchase", "renewal"]).optional(),
  instanceId: z.number().int().positive().nullable().optional(),
  orderId: z.number().int().positive().optional(),
})

type BillingTransactionMetadata = {
  purchaseType: "new_purchase" | "renewal"
  instanceId: number | null
  orderId?: number
}

type TransactionSummaryRow = Awaited<
  ReturnType<ReturnType<typeof buildTransactionSummaryQuery>["orderBy"]>
>[number]

export class BillingError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = "BillingError"
  }
}

function requireInsertedRecord<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`Failed to create ${label}`)
  }

  return value
}

function parseBillingTransactionMetadata(
  metadata: unknown
): BillingTransactionMetadata {
  const parsed = billingTransactionMetadataSchema.safeParse(metadata)

  if (!parsed.success) {
    return {
      purchaseType: "new_purchase",
      instanceId: null,
    }
  }

  const instanceId = parsed.data.instanceId ?? null

  return {
    purchaseType:
      parsed.data.purchaseType ?? (instanceId ? "renewal" : "new_purchase"),
    instanceId,
    orderId: parsed.data.orderId,
  }
}

function createInvoiceNumber() {
  return `INV-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`
}

function createInvoiceExpiry(baseDate = new Date()) {
  const expiresAt = new Date(baseDate)
  expiresAt.setHours(expiresAt.getHours() + PAYMENT_WINDOW_HOURS)
  return expiresAt
}

function buildTransactionSummaryQuery() {
  return db
    .select({
      transaction: {
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        method: transactions.method,
        status: transactions.status,
        reference: transactions.reference,
        failureReason: transactions.failureReason,
        createdAt: transactions.createdAt,
        confirmedAt: transactions.confirmedAt,
        metadata: transactions.metadata,
      },
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        expiresAt: invoices.expiresAt,
        paidAt: invoices.paidAt,
      },
      order: {
        id: orders.id,
        planId: orders.planId,
        planName: orders.planName,
        planPrice: orders.planPrice,
        durationDays: orders.durationDays,
        status: orders.status,
      },
      plan: {
        id: plans.id,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
    })
    .from(transactions)
    .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .leftJoin(plans, eq(orders.planId, plans.id))
}

async function loadInstanceMap(rows: TransactionSummaryRow[]) {
  const instanceIds = Array.from(
    new Set(
      rows
        .map((row) => parseBillingTransactionMetadata(row.transaction.metadata))
        .map((metadata) => metadata.instanceId)
        .filter((instanceId): instanceId is number => instanceId != null)
    )
  )

  if (instanceIds.length === 0) {
    return new Map<number, { id: number; ipAddress: string | null }>()
  }

  const linkedInstances = await db
    .select({
      id: instances.id,
      ipAddress: instances.ipAddress,
    })
    .from(instances)
    .where(inArray(instances.id, instanceIds))

  return new Map(linkedInstances.map((instance) => [instance.id, instance]))
}

async function mapTransactionSummaries(rows: TransactionSummaryRow[]) {
  const instanceMap = await loadInstanceMap(rows)

  return rows.map((row) => {
    const metadata = parseBillingTransactionMetadata(row.transaction.metadata)
    const instance = metadata.instanceId
      ? instanceMap.get(metadata.instanceId) ?? {
          id: metadata.instanceId,
          ipAddress: null,
        }
      : null

    return {
      id: row.transaction.id,
      userId: row.transaction.userId,
      amount: row.transaction.amount,
      method: row.transaction.method,
      status: row.transaction.status,
      createdAt: row.transaction.createdAt,
      confirmedAt: row.transaction.confirmedAt,
      reference: row.transaction.reference,
      failureReason: row.transaction.failureReason,
      kind: metadata.purchaseType,
      order: {
        id: row.order.id,
        status: row.order.status,
      },
      invoice: {
        id: row.invoice.id,
        invoiceNumber: row.invoice.invoiceNumber,
        status: row.invoice.status,
        totalAmount: row.invoice.totalAmount,
        currency: row.invoice.currency,
        expiresAt: row.invoice.expiresAt,
        paidAt: row.invoice.paidAt,
      },
      plan: {
        id: row.order.planId,
        name: row.order.planName,
        cpu: row.plan?.cpu ?? 0,
        ram: row.plan?.ram ?? 0,
        storage: row.plan?.storage ?? 0,
        durationDays: row.order.durationDays,
        price: row.order.planPrice,
      },
      instance,
    }
  })
}

export async function findPendingTransactionForInstance(
  userId: number,
  instanceId: number
) {
  const pendingTransactions = await db
    .select({
      id: transactions.id,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.status, "pending"),
        sql`${transactions.metadata} ->> 'instanceId' = ${String(instanceId)}`
      )
    )
    .limit(1)

  return pendingTransactions[0] ?? null
}

export async function createBillingTransaction(input: {
  userId: number
  planId: number
  method: SupportedPaymentMethod
  instanceId?: number
}) {
  const planResult = await db
    .select()
    .from(plans)
    .where(eq(plans.id, input.planId))
    .limit(1)

  const plan = planResult[0]

  if (!plan) {
    throw new BillingError(400, "Invalid planId")
  }

  const totalAmount = await calculatePrice(input.userId, input.planId)
  const discount = Math.max(0, plan.price - totalAmount)
  const purchaseType = input.instanceId ? "renewal" : "new_purchase"
  const now = new Date()

  const created = await db.transaction(async (tx) => {
    const insertedOrders = await tx
      .insert(orders)
      .values({
        userId: input.userId,
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
        durationDays: plan.durationDays,
        status: "pending_payment",
      })
      .returning()

    const order = requireInsertedRecord(insertedOrders[0], "order")

    const insertedInvoices = await tx
      .insert(invoices)
      .values({
        orderId: order.id,
        invoiceNumber: createInvoiceNumber(),
        subtotal: plan.price,
        discount,
        totalAmount,
        status: "unpaid",
        expiresAt: createInvoiceExpiry(now),
      })
      .returning()

    const invoice = requireInsertedRecord(insertedInvoices[0], "invoice")

    const insertedTransactions = await tx
      .insert(transactions)
      .values({
        userId: input.userId,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: input.method,
        status: "pending",
        metadata: {
          purchaseType,
          instanceId: input.instanceId ?? null,
          orderId: order.id,
        },
      })
      .returning()

    const transaction = requireInsertedRecord(
      insertedTransactions[0],
      "transaction"
    )

    return {
      transaction,
      invoice,
      order,
    }
  })

  return {
    id: created.transaction.id,
    userId: created.transaction.userId,
    amount: created.transaction.amount,
    method: created.transaction.method,
    status: created.transaction.status,
    createdAt: created.transaction.createdAt,
    confirmedAt: created.transaction.confirmedAt,
    kind: purchaseType,
    order: {
      id: created.order.id,
      status: created.order.status,
    },
    invoice: {
      id: created.invoice.id,
      invoiceNumber: created.invoice.invoiceNumber,
      status: created.invoice.status,
      totalAmount: created.invoice.totalAmount,
      currency: created.invoice.currency,
      expiresAt: created.invoice.expiresAt,
      paidAt: created.invoice.paidAt,
    },
    plan: {
      id: plan.id,
      name: created.order.planName,
      cpu: plan.cpu,
      ram: plan.ram,
      storage: plan.storage,
      durationDays: created.order.durationDays,
      price: created.order.planPrice,
    },
    instance: input.instanceId
      ? {
          id: input.instanceId,
          ipAddress: null,
        }
      : null,
  }
}

export async function listUserTransactions(userId: number) {
  const rows = await buildTransactionSummaryQuery()
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))

  return mapTransactionSummaries(rows)
}

export async function listInstanceTransactions(userId: number, instanceId: number) {
  const rows = await buildTransactionSummaryQuery()
    .where(
      and(
        eq(transactions.userId, userId),
        sql`${transactions.metadata} ->> 'instanceId' = ${String(instanceId)}`
      )
    )
    .orderBy(desc(transactions.createdAt))

  return mapTransactionSummaries(rows)
}

export async function listPendingTransactions() {
  const rows = await buildTransactionSummaryQuery()
    .where(eq(transactions.status, "pending"))
    .orderBy(desc(transactions.createdAt))

  return mapTransactionSummaries(rows)
}

export async function confirmPendingTransaction(transactionId: number) {
  return db.transaction(async (tx) => {
    const txResult = await tx
      .select({
        transaction: {
          id: transactions.id,
          userId: transactions.userId,
          invoiceId: transactions.invoiceId,
          amount: transactions.amount,
          method: transactions.method,
          status: transactions.status,
          metadata: transactions.metadata,
        },
        invoice: {
          id: invoices.id,
          status: invoices.status,
        },
        order: {
          id: orders.id,
          planId: orders.planId,
          durationDays: orders.durationDays,
          status: orders.status,
        },
      })
      .from(transactions)
      .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .where(eq(transactions.id, transactionId))
      .limit(1)

    const current = txResult[0]

    if (!current) {
      throw new BillingError(404, "Transaction not found")
    }

    if (current.transaction.status !== "pending") {
      throw new BillingError(400, "Already processed")
    }

    if (current.invoice.status === "paid") {
      throw new BillingError(400, "Invoice already paid")
    }

    const planResult = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, current.order.planId))
      .limit(1)

    const plan = planResult[0]

    if (!plan) {
      throw new BillingError(400, "Invalid plan")
    }

    const metadata = parseBillingTransactionMetadata(current.transaction.metadata)
    const now = new Date()

    let instance = null
    let orderStatus: "processing" | "completed" = "processing"

    if (metadata.purchaseType === "renewal") {
      if (!metadata.instanceId) {
        throw new BillingError(400, "Renewal transaction missing instanceId")
      }

      const instanceResult = await tx
        .select()
        .from(instances)
        .where(eq(instances.id, metadata.instanceId))
        .limit(1)

      const existingInstance = instanceResult[0]

      if (!existingInstance) {
        throw new BillingError(404, "Instance not found")
      }

      if (existingInstance.userId !== current.transaction.userId) {
        throw new BillingError(403, "Forbidden")
      }

      if (existingInstance.status === "terminated") {
        throw new BillingError(400, "Cannot renew a terminated instance")
      }

      const baseDate =
        existingInstance.expiryDate && existingInstance.expiryDate > now
          ? existingInstance.expiryDate
          : now

      const newExpiryDate = new Date(baseDate)
      newExpiryDate.setDate(newExpiryDate.getDate() + current.order.durationDays)

      const updatedInstance = await tx
        .update(instances)
        .set({
          expiryDate: newExpiryDate,
          status: "active",
        })
        .where(eq(instances.id, existingInstance.id))
        .returning()

      instance = updatedInstance[0] ?? null
      orderStatus = "completed"
    } else {
      const createdInstance = await tx
        .insert(instances)
        .values({
          userId: current.transaction.userId,
          planId: plan.id,
          status: "pending",
        })
        .returning()

      instance = createdInstance[0] ?? null
    }

    const nextMetadata = {
      purchaseType: metadata.purchaseType,
      instanceId: instance?.id ?? metadata.instanceId ?? null,
      orderId: current.order.id,
    }

    await tx
      .update(transactions)
      .set({
        status: "confirmed",
        confirmedAt: now,
        metadata: nextMetadata,
      })
      .where(eq(transactions.id, current.transaction.id))

    await tx
      .update(invoices)
      .set({
        status: "paid",
        paidAt: now,
      })
      .where(eq(invoices.id, current.invoice.id))

    await tx
      .update(orders)
      .set({
        status: orderStatus,
      })
      .where(eq(orders.id, current.order.id))

    return {
      message:
        metadata.purchaseType === "renewal"
          ? "Renewal successful. Instance extended."
          : "Payment confirmed. Instance pending provisioning.",
      instance,
      order: {
        id: current.order.id,
        status: orderStatus,
      },
      invoice: {
        id: current.invoice.id,
        status: "paid" as const,
      },
      transaction: {
        id: current.transaction.id,
        status: "confirmed" as const,
        confirmedAt: now,
      },
      kind: metadata.purchaseType,
    }
  })
}
