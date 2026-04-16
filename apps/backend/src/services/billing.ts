import { randomUUID } from "node:crypto"
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import {
  instances,
  invoices,
  orders,
  planPricing,
  plans,
  resources,
  transactions,
} from "../schema.js"
import { calculatePrice } from "./pricing.js"

const PAYMENT_WINDOW_HOURS = 24

export const supportedPaymentMethodSchema = z.enum(["upi", "usdt_trc20"])

export type SupportedPaymentMethod = z.infer<
  typeof supportedPaymentMethodSchema
>

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

function createInvoiceNumber() {
  return `INV-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`
}

function createTransactionReference() {
  return `TXN-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`
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
        invoiceId: transactions.invoiceId,
        instanceId: transactions.instanceId,
        amount: transactions.amount,
        method: transactions.method,
        gateway: transactions.gateway,
        status: transactions.status,
        reference: transactions.reference,
        failureReason: transactions.failureReason,
        createdAt: transactions.createdAt,
        confirmedAt: transactions.confirmedAt,
      },
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        expiresAt: invoices.expiresAt,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
      },
      order: {
        id: orders.id,
        kind: orders.kind,
        planId: orders.planId,
        planPricingId: orders.planPricingId,
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

async function loadResourceMap(rows: TransactionSummaryRow[]) {
  const instanceIds = Array.from(
    new Set(
      rows
        .map((row) => row.transaction.instanceId)
        .filter((instanceId): instanceId is number => instanceId != null)
    )
  )

  if (instanceIds.length === 0) {
    return new Map<number, { instanceId: number; ipAddress: string | null }>()
  }

  const linkedResources = await db
    .select({
      instanceId: resources.instanceId,
      ipAddress: resources.ipAddress,
    })
    .from(resources)
    .where(inArray(resources.instanceId, instanceIds))

  return new Map(
    linkedResources.map((resource) => [resource.instanceId, resource])
  )
}

async function mapTransactionSummaries(rows: TransactionSummaryRow[]) {
  const resourceMap = await loadResourceMap(rows)

  return rows.map((row) => {
    const instance = row.transaction.instanceId
      ? (resourceMap.get(row.transaction.instanceId) ?? {
          instanceId: row.transaction.instanceId,
          ipAddress: null,
        })
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
      kind: row.order.kind,
      order: {
        id: row.order.id,
        status: row.order.status,
      },
      pricing: {
        id: row.order.planPricingId,
        durationDays: row.order.durationDays,
        price: row.order.planPrice,
      },
      invoice: {
        id: row.invoice.id,
        invoiceNumber: row.invoice.invoiceNumber,
        status: row.invoice.status,
        totalAmount: row.invoice.totalAmount,
        currency: row.invoice.currency,
        expiresAt: row.invoice.expiresAt,
        paidAt: row.invoice.paidAt,
        createdAt: row.invoice.createdAt,
      },
      plan: {
        id: row.order.planId,
        name: row.order.planName,
        cpu: row.plan?.cpu ?? 0,
        ram: row.plan?.ram ?? 0,
        storage: row.plan?.storage ?? 0,
      },
      instance: instance
        ? {
            id: instance.instanceId,
            ipAddress: instance.ipAddress,
          }
        : null,
    }
  })
}

export async function getDefaultPlanPricingForPlan(planId: number) {
  const pricingOptions = await db
    .select({
      id: planPricing.id,
      planId: planPricing.planId,
      durationDays: planPricing.durationDays,
      price: planPricing.price,
      isActive: planPricing.isActive,
    })
    .from(planPricing)
    .where(and(eq(planPricing.planId, planId), eq(planPricing.isActive, true)))
    .orderBy(asc(planPricing.durationDays), asc(planPricing.id))
    .limit(1)

  return pricingOptions[0] ?? null
}

export async function getPlanPricingById(planPricingId: number) {
  const pricingOptions = await db
    .select({
      id: planPricing.id,
      planId: planPricing.planId,
      durationDays: planPricing.durationDays,
      price: planPricing.price,
      isActive: planPricing.isActive,
      plan: {
        id: plans.id,
        name: plans.name,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
        isActive: plans.isActive,
      },
    })
    .from(planPricing)
    .innerJoin(plans, eq(planPricing.planId, plans.id))
    .where(eq(planPricing.id, planPricingId))
    .limit(1)

  return pricingOptions[0] ?? null
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
        eq(transactions.instanceId, instanceId),
        eq(transactions.status, "pending")
      )
    )
    .limit(1)

  return pendingTransactions[0] ?? null
}

export async function createBillingTransaction(input: {
  userId: number
  planPricingId: number
  method: SupportedPaymentMethod
  instanceId?: number
}) {
  const pricingSelection = await getPlanPricingById(input.planPricingId)

  if (!pricingSelection || !pricingSelection.isActive) {
    throw new BillingError(400, "Invalid planPricingId")
  }

  if (!pricingSelection.plan.isActive) {
    throw new BillingError(400, "Selected plan is inactive")
  }

  const totalAmount = await calculatePrice(input.userId, input.planPricingId)
  const discount = Math.max(0, pricingSelection.price - totalAmount)
  const orderKind = input.instanceId ? "renewal" : "new_purchase"
  const now = new Date()

  const created = await db.transaction(async (tx) => {
    const insertedOrders = await tx
      .insert(orders)
      .values({
        userId: input.userId,
        planId: pricingSelection.plan.id,
        planPricingId: pricingSelection.id,
        kind: orderKind,
        planName: pricingSelection.plan.name,
        planPrice: pricingSelection.price,
        durationDays: pricingSelection.durationDays,
        status: "pending_payment",
      })
      .returning()

    const order = requireInsertedRecord(insertedOrders[0], "order")

    const insertedInvoices = await tx
      .insert(invoices)
      .values({
        orderId: order.id,
        invoiceNumber: createInvoiceNumber(),
        subtotal: pricingSelection.price,
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
        instanceId: input.instanceId ?? null,
        amount: invoice.totalAmount,
        method: input.method,
        status: "pending",
        reference: createTransactionReference(),
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
    reference: created.transaction.reference,
    kind: created.order.kind,
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
      id: pricingSelection.plan.id,
      name: created.order.planName,
      cpu: pricingSelection.plan.cpu,
      ram: pricingSelection.plan.ram,
      storage: pricingSelection.plan.storage,
    },
    pricing: {
      id: pricingSelection.id,
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

export async function listUserInvoices(userId: number) {
  const rows = await buildTransactionSummaryQuery()
    .where(eq(transactions.userId, userId))
    .orderBy(desc(invoices.createdAt), desc(transactions.createdAt))

  return rows.map((row) => ({
    id: row.invoice.id,
    invoiceNumber: row.invoice.invoiceNumber,
    status: row.invoice.status,
    totalAmount: row.invoice.totalAmount,
    currency: row.invoice.currency,
    expiresAt: row.invoice.expiresAt,
    paidAt: row.invoice.paidAt,
    createdAt: row.invoice.createdAt,
    transaction: {
      id: row.transaction.id,
      reference: row.transaction.reference,
      status: row.transaction.status,
      method: row.transaction.method,
    },
    plan: {
      name: row.order.planName,
      durationDays: row.order.durationDays,
      kind: row.order.kind,
    },
  }))
}

export async function listInstanceTransactions(
  userId: number,
  instanceId: number
) {
  const rows = await buildTransactionSummaryQuery()
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.instanceId, instanceId)
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

export async function listAdminTransactions() {
  const rows = await buildTransactionSummaryQuery().orderBy(
    sql`case when ${transactions.status} = 'pending' then 0 else 1 end`,
    desc(transactions.createdAt)
  )

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
          instanceId: transactions.instanceId,
          amount: transactions.amount,
          method: transactions.method,
          status: transactions.status,
        },
        invoice: {
          id: invoices.id,
          status: invoices.status,
        },
        order: {
          id: orders.id,
          kind: orders.kind,
          planId: orders.planId,
          planPricingId: orders.planPricingId,
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

    const now = new Date()
    let instance = null
    let orderStatus: "processing" | "completed" = "processing"

    if (current.order.kind === "renewal") {
      if (!current.transaction.instanceId) {
        throw new BillingError(400, "Renewal transaction missing instanceId")
      }

      const instanceResult = await tx
        .select()
        .from(instances)
        .where(eq(instances.id, current.transaction.instanceId))
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
      newExpiryDate.setDate(
        newExpiryDate.getDate() + current.order.durationDays
      )

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
          originOrderId: current.order.id,
          planId: current.order.planId,
          status: "pending",
        })
        .returning()

      instance = createdInstance[0] ?? null
    }

    await tx
      .update(transactions)
      .set({
        instanceId: instance?.id ?? current.transaction.instanceId ?? null,
        status: "confirmed",
        confirmedAt: now,
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
        current.order.kind === "renewal"
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
      kind: current.order.kind,
    }
  })
}
