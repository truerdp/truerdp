import { randomUUID } from "node:crypto"
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lt,
  sql,
  type SQL,
} from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import {
  instances,
  invoices,
  orders,
  planPricing,
  plans,
  resources,
  servers,
  transactions,
  type OrderBillingDetails,
  users,
} from "../schema.js"
import { calculatePrice } from "./pricing.js"
import { createCheckoutSessionForTransaction } from "./dodo-payments.js"

const PAYMENT_WINDOW_HOURS = 48

export const supportedPaymentMethodSchema = z.enum([
  "upi",
  "usdt_trc20",
  "dodo_checkout",
])

export type SupportedPaymentMethod = z.infer<
  typeof supportedPaymentMethodSchema
>
export type BillingDetailsInput = OrderBillingDetails

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

type BillingTransactionRecord = {
  transaction: typeof transactions.$inferSelect
  invoice: typeof invoices.$inferSelect
  order: typeof orders.$inferSelect
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }
}

type LegacyPricedOrderRecord = {
  planPriceUsdCents?: number | null
  planPrice?: number | null
}

function getOrderPlanPriceUsdCents(order: LegacyPricedOrderRecord) {
  return order.planPriceUsdCents ?? order.planPrice ?? null
}

function buildOrderPriceInsertValue(planPriceUsdCents: number) {
  if ("planPriceUsdCents" in orders) {
    return {
      planPriceUsdCents,
    } as Record<string, number>
  }

  return {
    planPrice: planPriceUsdCents,
  } as Record<string, number>
}

function formatBillingTransactionResponse(record: BillingTransactionRecord) {
  const planPriceUsdCents = getOrderPlanPriceUsdCents(record.order)

  return {
    id: record.transaction.id,
    userId: record.transaction.userId,
    amount: record.transaction.amount,
    method: record.transaction.method,
    status: record.transaction.status,
    createdAt: record.transaction.createdAt,
    confirmedAt: record.transaction.confirmedAt,
    reference: record.transaction.reference,
    kind: record.order.kind,
    order: {
      id: record.order.id,
      status: record.order.status,
    },
    invoice: {
      id: record.invoice.id,
      invoiceNumber: record.invoice.invoiceNumber,
      status: record.invoice.status,
      totalAmount: record.invoice.totalAmount,
      currency: record.invoice.currency,
      expiresAt: record.invoice.expiresAt,
      paidAt: record.invoice.paidAt,
    },
    plan: {
      id: record.plan.id,
      name: record.plan.name,
      cpu: record.plan.cpu,
      ram: record.plan.ram,
      storage: record.plan.storage,
    },
    pricing: {
      id: record.order.planPricingId,
      durationDays: record.order.durationDays,
      priceUsdCents: planPriceUsdCents,
    },
    instance: record.transaction.instanceId
      ? {
          id: record.transaction.instanceId,
          ipAddress: null,
        }
      : null,
  }
}

async function expireStaleBillingAttempts(input: {
  userId: number
  orderId: number
  now: Date
}) {
  const staleInvoices = await db
    .select({
      invoiceId: invoices.id,
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, input.userId),
        eq(orders.id, input.orderId),
        eq(invoices.status, "unpaid"),
        lt(invoices.expiresAt, input.now)
      )
    )

  if (staleInvoices.length === 0) {
    return
  }

  const staleInvoiceIds = staleInvoices.map((invoice) => invoice.invoiceId)

  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        status: "expired",
      })
      .where(inArray(invoices.id, staleInvoiceIds))

    await tx
      .update(transactions)
      .set({
        status: "failed",
        failureReason: "Invoice expired",
      })
      .where(
        and(
          inArray(transactions.invoiceId, staleInvoiceIds),
          eq(transactions.status, "pending")
        )
      )
  })
}

async function findReusableBillingTransaction(input: {
  userId: number
  orderId: number
  now: Date
}) {
  const reusableAttempts = await db
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
        idempotencyKey: transactions.idempotencyKey,
        failureReason: transactions.failureReason,
        metadata: transactions.metadata,
        confirmedAt: transactions.confirmedAt,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      },
      invoice: {
        id: invoices.id,
        orderId: invoices.orderId,
        invoiceNumber: invoices.invoiceNumber,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        couponId: invoices.couponId,
        status: invoices.status,
        expiresAt: invoices.expiresAt,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      },
      order: {
        id: orders.id,
        userId: orders.userId,
        planId: orders.planId,
        planPricingId: orders.planPricingId,
        renewalInstanceId: orders.renewalInstanceId,
        kind: orders.kind,
        planName: orders.planName,
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        billingDetails: orders.billingDetails,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      },
      plan: {
        id: plans.id,
        name: orders.planName,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
    })
    .from(transactions)
    .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(plans, eq(orders.planId, plans.id))
    .where(
      and(
        eq(transactions.userId, input.userId),
        eq(transactions.status, "pending"),
        eq(invoices.status, "unpaid"),
        eq(orders.status, "pending_payment"),
        eq(orders.id, input.orderId),
        gte(invoices.expiresAt, input.now)
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(1)

  return reusableAttempts[0] ?? null
}

async function findReusableInvoice(input: { orderId: number; now: Date }) {
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.orderId, input.orderId),
        eq(invoices.status, "unpaid"),
        gte(invoices.expiresAt, input.now)
      )
    )
    .orderBy(desc(invoices.createdAt))
    .limit(1)

  return invoiceResult[0] ?? null
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
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        status: orders.status,
      },
      plan: {
        id: plans.id,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(transactions)
    .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .leftJoin(plans, eq(orders.planId, plans.id))
    .innerJoin(users, eq(transactions.userId, users.id))
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
      ipAddress: servers.ipAddress,
    })
    .from(resources)
    .leftJoin(servers, eq(resources.serverId, servers.id))
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
      user: {
        id: row.user.id,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        email: row.user.email,
      },
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
        priceUsdCents: row.order.planPriceUsdCents,
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
      priceUsdCents: planPricing.priceUsdCents,
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
      priceUsdCents: planPricing.priceUsdCents,
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

type BillingOrderRecord = {
  order: typeof orders.$inferSelect
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }
}

function formatBillingOrderResponse(record: BillingOrderRecord) {
  const planPriceUsdCents = getOrderPlanPriceUsdCents(record.order)

  return {
    orderId: record.order.id,
    userId: record.order.userId,
    kind: record.order.kind,
    status: record.order.status,
    createdAt: record.order.createdAt,
    updatedAt: record.order.updatedAt,
    billingDetails: record.order.billingDetails,
    plan: {
      id: record.plan.id,
      name: record.order.planName,
      cpu: record.plan.cpu,
      ram: record.plan.ram,
      storage: record.plan.storage,
    },
    pricing: {
      id: record.order.planPricingId,
      durationDays: record.order.durationDays,
      priceUsdCents: planPriceUsdCents,
    },
  }
}

async function getBillingOrderById(orderId: number) {
  const orderResult = await db
    .select({
      order: {
        id: orders.id,
        userId: orders.userId,
        planId: orders.planId,
        planPricingId: orders.planPricingId,
        renewalInstanceId: orders.renewalInstanceId,
        kind: orders.kind,
        planName: orders.planName,
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        billingDetails: orders.billingDetails,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      },
      plan: {
        id: plans.id,
        name: plans.name,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
    })
    .from(orders)
    .innerJoin(plans, eq(orders.planId, plans.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  return orderResult[0] ?? null
}

export async function getBillingOrderForUser(userId: number, orderId: number) {
  const record = await getBillingOrderById(orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== userId) {
    throw new BillingError(403, "Forbidden")
  }

  return formatBillingOrderResponse(record)
}

export async function updateBillingDetailsForUser(input: {
  userId: number
  orderId: number
  billingDetails: BillingDetailsInput
}) {
  const record = await getBillingOrderById(input.orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (record.order.status !== "pending_payment") {
    throw new BillingError(
      400,
      "Billing details can only be updated pre-payment"
    )
  }

  await db
    .update(orders)
    .set({
      billingDetails: input.billingDetails,
    })
    .where(eq(orders.id, input.orderId))

  const updated = await getBillingOrderById(input.orderId)

  if (!updated) {
    throw new BillingError(404, "Order not found")
  }

  return formatBillingOrderResponse(updated)
}

export async function createBillingOrder(input: {
  userId: number
  planPricingId: number
  instanceId?: number
}) {
  const pricingSelection = await getPlanPricingById(input.planPricingId)

  if (!pricingSelection || !pricingSelection.isActive) {
    throw new BillingError(400, "Invalid planPricingId")
  }

  if (!pricingSelection.plan.isActive) {
    throw new BillingError(400, "Selected plan is inactive")
  }

  const orderKind = input.instanceId ? "renewal" : "new_purchase"

  if (input.instanceId != null) {
    const instanceResult = await db
      .select()
      .from(instances)
      .where(eq(instances.id, input.instanceId))
      .limit(1)

    const instance = instanceResult[0]

    if (!instance) {
      throw new BillingError(404, "Instance not found")
    }

    if (instance.userId !== input.userId) {
      throw new BillingError(403, "Forbidden")
    }

    if (instance.planId !== pricingSelection.planId) {
      throw new BillingError(400, "Renewal must use the instance plan")
    }

    const isExpired =
      instance.expiryDate != null && instance.expiryDate < new Date()

    if (!["active", "expired"].includes(instance.status) && !isExpired) {
      throw new BillingError(400, "Instance is not eligible for renewal")
    }
  }

  const planPriceUsdCents =
    pricingSelection.priceUsdCents ??
    (pricingSelection as { price?: number }).price

  if (!Number.isFinite(planPriceUsdCents)) {
    throw new BillingError(500, "Plan pricing is missing a valid price")
  }
  const planPriceUsdCentsValue = Number(planPriceUsdCents)

  const totalAmount = await calculatePrice(input.userId, pricingSelection.id)
  const discount = Math.max(0, planPriceUsdCentsValue - totalAmount)
  const now = new Date()

  const createdOrder = await db.transaction(async (tx) => {
    const orderInsertValues = {
      userId: input.userId,
      planId: pricingSelection.plan.id,
      planPricingId: pricingSelection.id,
      renewalInstanceId: input.instanceId ?? null,
      kind: orderKind,
      planName: pricingSelection.plan.name,
      ...buildOrderPriceInsertValue(planPriceUsdCentsValue),
      durationDays: pricingSelection.durationDays,
      status: "pending_payment",
    } as typeof orders.$inferInsert

    const insertedOrders = await tx
      .insert(orders)
      .values(orderInsertValues)
      .returning()

    const order = requireInsertedRecord(insertedOrders[0], "order")
    const orderPlanPriceUsdCents = getOrderPlanPriceUsdCents(order)

    if (!Number.isFinite(orderPlanPriceUsdCents)) {
      throw new BillingError(500, "Order insert did not persist plan price")
    }
    const orderPlanPriceUsdCentsValue = Number(orderPlanPriceUsdCents)

    await tx.insert(invoices).values({
      orderId: order.id,
      invoiceNumber: createInvoiceNumber(),
      subtotal: orderPlanPriceUsdCentsValue,
      discount,
      totalAmount,
      status: "unpaid",
      expiresAt: createInvoiceExpiry(now),
    })

    return order
  })

  return formatBillingOrderResponse({
    order: createdOrder,
    plan: {
      id: pricingSelection.plan.id,
      name: pricingSelection.plan.name,
      cpu: pricingSelection.plan.cpu,
      ram: pricingSelection.plan.ram,
      storage: pricingSelection.plan.storage,
    },
  })
}

export async function createBillingTransaction(input: {
  userId: number
  orderId: number
  method: SupportedPaymentMethod
}) {
  const orderResult = await getBillingOrderById(input.orderId)

  if (!orderResult) {
    throw new BillingError(404, "Order not found")
  }

  if (orderResult.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (orderResult.order.status !== "pending_payment") {
    throw new BillingError(400, "Order is not pending payment")
  }

  if (!orderResult.order.billingDetails) {
    throw new BillingError(400, "Billing details are required before payment")
  }

  const pricingSelection = await getPlanPricingById(
    orderResult.order.planPricingId
  )

  if (!pricingSelection || !pricingSelection.isActive) {
    throw new BillingError(400, "Order pricing is no longer active")
  }

  if (!pricingSelection.plan.isActive) {
    throw new BillingError(400, "Selected plan is inactive")
  }

  const orderPlanPriceUsdCents = getOrderPlanPriceUsdCents(orderResult.order)

  if (!Number.isFinite(orderPlanPriceUsdCents)) {
    throw new BillingError(500, "Order is missing a valid plan price snapshot")
  }
  const orderPlanPriceUsdCentsValue = Number(orderPlanPriceUsdCents)

  const totalAmount = await calculatePrice(
    input.userId,
    orderResult.order.planPricingId
  )
  const discount = Math.max(0, orderPlanPriceUsdCentsValue - totalAmount)
  const now = new Date()

  await expireStaleBillingAttempts({
    userId: input.userId,
    orderId: orderResult.order.id,
    now,
  })

  const reusableTransaction = await findReusableBillingTransaction({
    userId: input.userId,
    orderId: orderResult.order.id,
    now,
  })

  if (reusableTransaction) {
    return formatBillingTransactionResponse(reusableTransaction)
  }

  const reusableInvoice = await findReusableInvoice({
    orderId: orderResult.order.id,
    now,
  })

  const created = await db.transaction(async (tx) => {
    let invoice = reusableInvoice

    if (!invoice) {
      const insertedInvoices = await tx
        .insert(invoices)
        .values({
          orderId: orderResult.order.id,
          invoiceNumber: createInvoiceNumber(),
          subtotal: orderPlanPriceUsdCentsValue,
          discount,
          totalAmount,
          status: "unpaid",
          expiresAt: createInvoiceExpiry(now),
        })
        .returning()

      invoice = requireInsertedRecord(insertedInvoices[0], "invoice")
    }

    const insertedTransactions = await tx
      .insert(transactions)
      .values({
        userId: input.userId,
        invoiceId: invoice.id,
        instanceId: orderResult.order.renewalInstanceId,
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
      order: orderResult.order,
    }
  })

  let gatewayRedirectUrl: string | null = null
  if (input.method === "dodo_checkout") {
    const billing = orderResult.order.billingDetails
    const name =
      (billing?.firstName?.trim() || "") +
      (billing?.lastName ? ` ${billing.lastName.trim()}` : "")
    const customer =
      billing && (billing.email || name.trim())
        ? {
            email: billing.email,
            name: name.trim() || undefined,
            phone_number: billing.phone ?? undefined,
          }
        : undefined

    // Ensure we always have a non-null reference for external reconciliation
    const txnRef = created.transaction.reference ?? createTransactionReference()
    if (!created.transaction.reference) {
      await db
        .update(transactions)
        .set({ reference: txnRef })
        .where(eq(transactions.id, created.transaction.id))
      // reflect the reference on the in-memory object used for response
      ;(
        created.transaction as unknown as { reference: string | null }
      ).reference = txnRef
    }

    const session = await createCheckoutSessionForTransaction({
      planPricingId: orderResult.order.planPricingId,
      amountMinor: created.invoice.totalAmount,
      currency: created.invoice.currency,
      orderId: orderResult.order.id,
      invoiceId: created.invoice.id,
      transactionId: created.transaction.id,
      reference: txnRef,
      customer,
      billing: billing
        ? {
            street: billing.addressLine1,
            city: billing.city,
            state: billing.state,
            zipcode: billing.postalCode,
            country: billing.country,
          }
        : undefined,
    })

    await db
      .update(transactions)
      .set({
        metadata: {
          dodo_session_id: session.sessionId,
          dodo_checkout_url: session.checkoutUrl,
          dodo_environment: session.environment,
        } as unknown as typeof transactions.$inferInsert.metadata,
      })
      .where(eq(transactions.id, created.transaction.id))

    gatewayRedirectUrl = session.checkoutUrl
  }

  const response = formatBillingTransactionResponse({
    transaction: created.transaction,
    invoice: created.invoice,
    order: created.order,
    plan: {
      id: orderResult.plan.id,
      name: created.order.planName,
      cpu: orderResult.plan.cpu,
      ram: orderResult.plan.ram,
      storage: orderResult.plan.storage,
    },
  })

  return {
    ...response,
    gatewayRedirectUrl,
  }
}

export async function listUserTransactions(userId: number) {
  const rows = await buildTransactionSummaryQuery()
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))

  return mapTransactionSummaries(rows)
}

export async function listUserInvoices(userId: number) {
  const rows = await db
    .select({
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
        status: orders.status,
        planName: orders.planName,
        durationDays: orders.durationDays,
        kind: orders.kind,
      },
      transaction: {
        id: transactions.id,
        reference: transactions.reference,
        status: transactions.status,
        method: transactions.method,
        createdAt: transactions.createdAt,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .leftJoin(transactions, eq(transactions.invoiceId, invoices.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(invoices.createdAt), desc(transactions.createdAt))

  const latestByInvoice = new Map<number, (typeof rows)[number]>()

  for (const row of rows) {
    if (!latestByInvoice.has(row.invoice.id)) {
      latestByInvoice.set(row.invoice.id, row)
    }
  }

  return Array.from(latestByInvoice.values()).map((row) => ({
    id: row.invoice.id,
    invoiceNumber: row.invoice.invoiceNumber,
    status: row.invoice.status,
    totalAmount: row.invoice.totalAmount,
    currency: row.invoice.currency,
    expiresAt: row.invoice.expiresAt,
    paidAt: row.invoice.paidAt,
    createdAt: row.invoice.createdAt,
    transaction: {
      id: row.transaction?.id ?? null,
      reference: row.transaction?.reference ?? null,
      status: row.transaction?.status ?? null,
      method: row.transaction?.method ?? null,
    },
    order: {
      id: row.order.id,
      status: row.order.status,
    },
    plan: {
      name: row.order.planName,
      durationDays: row.order.durationDays,
      kind: row.order.kind,
    },
  }))
}

export type AdminInvoiceListParams = {
  page: number
  pageSize: number
  search?: string
  invoiceStatus?: "unpaid" | "paid" | "expired"
  transactionStatus?: "none" | "pending" | "confirmed" | "failed"
  method?: "none" | "upi" | "usdt_trc20" | "dodo_checkout"
}

export async function listAdminInvoices(params: AdminInvoiceListParams) {
  const latestTransactionIdSql = sql<number | null>`(
    select ${transactions.id}
    from ${transactions}
    where ${transactions.invoiceId} = ${invoices.id}
    order by ${transactions.createdAt} desc
    limit 1
  )`

  const latestTransactionReferenceSql = sql<string | null>`(
    select ${transactions.reference}
    from ${transactions}
    where ${transactions.invoiceId} = ${invoices.id}
    order by ${transactions.createdAt} desc
    limit 1
  )`

  const latestTransactionStatusSql = sql<
    "pending" | "confirmed" | "failed" | null
  >`(
    select ${transactions.status}
    from ${transactions}
    where ${transactions.invoiceId} = ${invoices.id}
    order by ${transactions.createdAt} desc
    limit 1
  )`

  const latestTransactionMethodSql = sql<
    "upi" | "usdt_trc20" | "dodo_checkout" | null
  >`(
    select ${transactions.method}
    from ${transactions}
    where ${transactions.invoiceId} = ${invoices.id}
    order by ${transactions.createdAt} desc
    limit 1
  )`

  const latestTransactionCreatedAtSql = sql<string | null>`(
    select ${transactions.createdAt}::text
    from ${transactions}
    where ${transactions.invoiceId} = ${invoices.id}
    order by ${transactions.createdAt} desc
    limit 1
  )`

  const conditions: SQL[] = []

  if (params.invoiceStatus) {
    conditions.push(eq(invoices.status, params.invoiceStatus))
  }

  if (params.transactionStatus === "none") {
    conditions.push(sql`${latestTransactionIdSql} is null`)
  } else if (params.transactionStatus) {
    conditions.push(
      sql`${latestTransactionStatusSql} = ${params.transactionStatus}`
    )
  }

  if (params.method === "none") {
    conditions.push(sql`${latestTransactionIdSql} is null`)
  } else if (params.method) {
    conditions.push(sql`${latestTransactionMethodSql} = ${params.method}`)
  }

  const normalizedSearch = params.search?.trim()

  if (normalizedSearch) {
    const pattern = `%${normalizedSearch}%`
    conditions.push(sql`(
      ${invoices.invoiceNumber} ilike ${pattern}
      or cast(${invoices.id} as text) ilike ${pattern}
      or cast(${orders.id} as text) ilike ${pattern}
      or cast(${orders.userId} as text) ilike ${pattern}
      or ${orders.planName} ilike ${pattern}
      or ${users.firstName} ilike ${pattern}
      or ${users.lastName} ilike ${pattern}
      or ${users.email} ilike ${pattern}
      or coalesce(${latestTransactionReferenceSql}, '') ilike ${pattern}
    )`)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const countResult = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(whereClause)

  const totalCount = countResult[0]?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / params.pageSize)
  const page = totalPages > 0 ? Math.min(params.page, totalPages) : 1
  const offset = (page - 1) * params.pageSize

  const rows = await db
    .select({
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
        userId: orders.userId,
        status: orders.status,
        planName: orders.planName,
        durationDays: orders.durationDays,
        kind: orders.kind,
      },
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
      transaction: {
        id: latestTransactionIdSql,
        reference: latestTransactionReferenceSql,
        status: latestTransactionStatusSql,
        method: latestTransactionMethodSql,
        createdAt: latestTransactionCreatedAtSql,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(whereClause)
    .orderBy(desc(invoices.createdAt))
    .limit(params.pageSize)
    .offset(offset)

  return {
    items: rows.map((row) => ({
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
        createdAt: row.transaction.createdAt,
      },
      order: {
        id: row.order.id,
        userId: row.order.userId,
        status: row.order.status,
      },
      user: {
        id: row.user.id,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        email: row.user.email,
      },
      plan: {
        name: row.order.planName,
        durationDays: row.order.durationDays,
        kind: row.order.kind,
      },
    })),
    pagination: {
      page,
      pageSize: params.pageSize,
      totalCount,
      totalPages,
    },
  }
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

export type AdminListPaginationParams = {
  page: number
  pageSize: number
}

export async function listAdminTransactions(params: AdminListPaginationParams) {
  const countResult = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(transactions)

  const totalCount = countResult[0]?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / params.pageSize)
  const page = totalPages > 0 ? Math.min(params.page, totalPages) : 1
  const offset = (page - 1) * params.pageSize

  const paginatedRows = await buildTransactionSummaryQuery()
    .orderBy(
      sql`case when ${transactions.status} = 'pending' then 0 else 1 end`,
      desc(transactions.createdAt)
    )
    .limit(params.pageSize)
    .offset(offset)

  return {
    items: await mapTransactionSummaries(paginatedRows),
    pagination: {
      page,
      pageSize: params.pageSize,
      totalCount,
      totalPages,
    },
  }
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
          status: "provisioning",
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
          : "Payment confirmed. Instance is ready for provisioning.",
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
