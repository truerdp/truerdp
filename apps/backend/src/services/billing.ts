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
  couponUsages,
  coupons,
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
import { createCoinGateOrderForTransaction } from "./coingate-payments.js"
import { createAdminAuditLog } from "./admin-audit.js"
import {
  sendAdminAlertEmail,
  sendExpiryReminderEmail,
  sendInvoiceCreatedEmail,
  sendPaymentFailedEmail,
  sendPaymentConfirmedEmail,
} from "./email.js"

const PAYMENT_WINDOW_HOURS = 48

export const supportedPaymentMethodSchema = z.enum([
  "upi",
  "usdt_trc20",
  "dodo_checkout",
  "coingate_checkout",
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

function formatEmailAmount(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountMinor / 100)
}

async function sendInvoiceCreatedNotification(invoiceId: number) {
  const [record] = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        expiresAt: invoices.expiresAt,
      },
      order: {
        planName: orders.planName,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(invoices.id, invoiceId))
    .limit(1)

  if (!record) {
    return
  }

  try {
    await sendInvoiceCreatedEmail({
      to: record.user.email,
      firstName: record.user.firstName,
      invoiceId: record.invoice.id,
      invoiceNumber: record.invoice.invoiceNumber,
      planName: record.order.planName,
      amount: formatEmailAmount(
        record.invoice.totalAmount,
        record.invoice.currency
      ),
      expiresAt: record.invoice.expiresAt,
    })
  } catch (emailError) {
    console.error("Failed to send invoice created email", emailError)
  }
}

async function sendPaymentConfirmedNotification(input: {
  invoiceId: number
  transactionId: number
}) {
  const [record] = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        paidAt: invoices.paidAt,
      },
      transaction: {
        reference: transactions.reference,
      },
      order: {
        planName: orders.planName,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(
      transactions,
      and(
        eq(transactions.id, input.transactionId),
        eq(transactions.invoiceId, invoices.id)
      )
    )
    .where(eq(invoices.id, input.invoiceId))
    .limit(1)

  if (!record || !record.invoice.paidAt) {
    return
  }

  try {
    await sendPaymentConfirmedEmail({
      to: record.user.email,
      firstName: record.user.firstName,
      invoiceId: record.invoice.id,
      invoiceNumber: record.invoice.invoiceNumber,
      transactionReference: record.transaction.reference,
      planName: record.order.planName,
      amount: formatEmailAmount(
        record.invoice.totalAmount,
        record.invoice.currency
      ),
      paidAt: record.invoice.paidAt,
    })
  } catch (emailError) {
    console.error("Failed to send payment confirmed email", emailError)
  }
}

async function sendPaymentFailedNotification(input: {
  invoiceId: number
  reason: string
}) {
  const [record] = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
      },
      order: {
        planName: orders.planName,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(invoices.id, input.invoiceId))
    .limit(1)

  if (!record) {
    return
  }

  try {
    await sendPaymentFailedEmail({
      to: record.user.email,
      firstName: record.user.firstName,
      invoiceNumber: record.invoice.invoiceNumber,
      invoiceId: record.invoice.id,
      planName: record.order.planName,
      amount: formatEmailAmount(
        record.invoice.totalAmount,
        record.invoice.currency
      ),
      reason: input.reason,
    })
  } catch (emailError) {
    console.error("Failed to send payment failed email", emailError)
  }
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

function extractGatewayRedirectUrlFromMetadata(input: {
  method: SupportedPaymentMethod
  metadata: unknown
}) {
  if (!input.metadata || typeof input.metadata !== "object") {
    return null
  }

  const metadata = input.metadata as Record<string, unknown>

  if (input.method === "dodo_checkout") {
    const value = metadata.dodo_checkout_url
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null
  }

  if (input.method === "coingate_checkout") {
    const value = metadata.coingate_payment_url
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null
  }

  return null
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

  for (const invoiceId of staleInvoiceIds) {
    try {
      await sendPaymentFailedNotification({
        invoiceId,
        reason: "Invoice expired before payment confirmation",
      })
    } catch (notificationError) {
      console.error(
        "Failed to send payment expiration notification",
        notificationError
      )
    }
  }
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
  invoice?:
    | (typeof invoices.$inferSelect & { couponCode?: string | null })
    | null
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
    invoice: record.invoice
      ? {
          id: record.invoice.id,
          invoiceNumber: record.invoice.invoiceNumber,
          subtotal: record.invoice.subtotal,
          discount: record.invoice.discount,
          totalAmount: record.invoice.totalAmount,
          currency: record.invoice.currency,
          couponId: record.invoice.couponId,
          couponCode: record.invoice.couponCode ?? null,
          status: record.invoice.status,
          expiresAt: record.invoice.expiresAt,
          paidAt: record.invoice.paidAt,
        }
      : null,
  }
}

async function getOrderInvoice(orderId: number) {
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(eq(invoices.orderId, orderId))
    .limit(1)

  return invoiceResult[0] ?? null
}

async function getCouponById(couponId: number | null | undefined) {
  if (!couponId) {
    return null
  }

  const [coupon] = await db
    .select({
      code: coupons.code,
      type: coupons.type,
      value: coupons.value,
      maxUses: coupons.maxUses,
      expiresAt: coupons.expiresAt,
    })
    .from(coupons)
    .where(eq(coupons.id, couponId))
    .limit(1)

  return coupon ?? null
}

async function assertOrderHasNoTransactions(orderId: number) {
  const existingTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.orderId, orderId),
        inArray(transactions.status, ["pending", "confirmed"])
      )
    )
    .limit(1)

  if (existingTransactions[0]) {
    throw new BillingError(
      400,
      "Coupon cannot be changed after payment has started"
    )
  }
}

async function markTransactionSetupFailed(
  transactionId: number,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to create hosted checkout session"

  await db
    .update(transactions)
    .set({
      status: "failed",
      failureReason: message,
    })
    .where(eq(transactions.id, transactionId))
}

function calculateCouponDiscount(input: {
  subtotal: number
  type: "percent" | "flat"
  value: number
}) {
  if (input.type === "percent") {
    if (input.value < 1 || input.value > 100) {
      throw new BillingError(400, "Percent coupon value must be 1-100")
    }

    return Math.floor((input.subtotal * input.value) / 100)
  }

  if (input.value < 1) {
    throw new BillingError(400, "Flat coupon value must be greater than zero")
  }

  return input.value
}

async function validateCouponForOrder(input: {
  userId: number
  order: typeof orders.$inferSelect
  code: string
}) {
  const normalizedCode = input.code.trim().toUpperCase()

  if (!normalizedCode) {
    throw new BillingError(400, "Coupon code is required")
  }

  const couponResult = await db
    .select()
    .from(coupons)
    .where(sql`upper(${coupons.code}) = ${normalizedCode}`)
    .limit(1)

  const coupon = couponResult[0]

  if (!coupon || !coupon.isActive) {
    throw new BillingError(400, "Coupon is not valid")
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new BillingError(400, "Coupon has expired")
  }

  if (
    coupon.appliesTo !== "all" &&
    coupon.appliesTo !== input.order.kind
  ) {
    throw new BillingError(400, "Coupon is not valid for this order")
  }

  const existingUsage = await db
    .select({ id: couponUsages.id })
    .from(couponUsages)
    .where(
      and(
        eq(couponUsages.couponId, coupon.id),
        eq(couponUsages.userId, input.userId)
      )
    )
    .limit(1)

  if (existingUsage[0]) {
    throw new BillingError(400, "Coupon has already been used")
  }

  if (coupon.maxUses != null) {
    const usageCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(couponUsages)
      .where(eq(couponUsages.couponId, coupon.id))

    const usageCount = usageCountResult[0]?.count ?? 0

    if (usageCount >= coupon.maxUses) {
      throw new BillingError(400, "Coupon usage limit has been reached")
    }
  }

  return coupon
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

  const invoice = await getOrderInvoice(orderId)
  const coupon = await getCouponById(invoice?.couponId)

  return formatBillingOrderResponse({
    ...record,
    invoice: invoice ? { ...invoice, couponCode: coupon?.code ?? null } : invoice,
  })
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

export async function applyCouponToBillingOrder(input: {
  userId: number
  orderId: number
  code: string
}) {
  const record = await getBillingOrderById(input.orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (record.order.status !== "pending_payment") {
    throw new BillingError(400, "Order is no longer payable")
  }

  await assertOrderHasNoTransactions(record.order.id)

  const invoice = await getOrderInvoice(record.order.id)

  if (!invoice || invoice.status !== "unpaid") {
    throw new BillingError(400, "Order does not have an unpaid invoice")
  }

  const coupon = await validateCouponForOrder({
    userId: input.userId,
    order: record.order,
    code: input.code,
  })

  const discount = Math.min(
    invoice.subtotal - 1,
    calculateCouponDiscount({
      subtotal: invoice.subtotal,
      type: coupon.type,
      value: coupon.value,
    })
  )

  if (discount < 1) {
    throw new BillingError(400, "Coupon does not reduce this invoice")
  }

  const [updatedInvoice] = await db
    .update(invoices)
    .set({
      discount,
      totalAmount: invoice.subtotal - discount,
      couponId: coupon.id,
    })
    .where(eq(invoices.id, invoice.id))
    .returning()

  return formatBillingOrderResponse({
    ...record,
    invoice: { ...(updatedInvoice ?? invoice), couponCode: coupon.code },
  })
}

export async function removeCouponFromBillingOrder(input: {
  userId: number
  orderId: number
}) {
  const record = await getBillingOrderById(input.orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (record.order.status !== "pending_payment") {
    throw new BillingError(400, "Order is no longer payable")
  }

  await assertOrderHasNoTransactions(record.order.id)

  const invoice = await getOrderInvoice(record.order.id)

  if (!invoice || invoice.status !== "unpaid") {
    throw new BillingError(400, "Order does not have an unpaid invoice")
  }

  const [updatedInvoice] = await db
    .update(invoices)
    .set({
      discount: 0,
      totalAmount: invoice.subtotal,
      couponId: null,
    })
    .where(eq(invoices.id, invoice.id))
    .returning()

  return formatBillingOrderResponse({
    ...record,
    invoice: { ...(updatedInvoice ?? invoice), couponCode: null },
  })
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

    if (instance.status === "suspended") {
      throw new BillingError(400, "Suspended instances cannot be renewed")
    }

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

  const created = await db.transaction(async (tx) => {
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

    const insertedInvoices = await tx
      .insert(invoices)
      .values({
        orderId: order.id,
        invoiceNumber: createInvoiceNumber(),
        subtotal: orderPlanPriceUsdCentsValue,
        discount,
        totalAmount,
        status: "unpaid",
        expiresAt: createInvoiceExpiry(now),
      })
      .returning({ id: invoices.id })

    const invoice = requireInsertedRecord(insertedInvoices[0], "invoice")

    return { order, invoiceId: invoice.id }
  })

  await sendInvoiceCreatedNotification(created.invoiceId)

  return formatBillingOrderResponse({
    order: created.order,
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
  ipAddress?: string | null
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
    const response = formatBillingTransactionResponse(reusableTransaction)
    const gatewayRedirectUrl = extractGatewayRedirectUrlFromMetadata({
      method: input.method,
      metadata: reusableTransaction.transaction.metadata,
    })

    return {
      ...response,
      gatewayRedirectUrl,
    }
  }

  const reusableInvoice = await findReusableInvoice({
    orderId: orderResult.order.id,
    now,
  })

  const created = await db.transaction(async (tx) => {
    let invoice = reusableInvoice
    let createdInvoiceId: number | null = null

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
      createdInvoiceId = invoice.id
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
      createdInvoiceId,
    }
  })

  if (created.createdInvoiceId) {
    await sendInvoiceCreatedNotification(created.createdInvoiceId)
  }

  let gatewayRedirectUrl: string | null = null
  const requiresHostedCheckout =
    input.method === "dodo_checkout" || input.method === "coingate_checkout"
  let transactionReference = created.transaction.reference

  if (requiresHostedCheckout && !transactionReference) {
    transactionReference = createTransactionReference()

    await db
      .update(transactions)
      .set({ reference: transactionReference })
      .where(eq(transactions.id, created.transaction.id))

    // reflect the reference on the in-memory object used for response
    ;(
      created.transaction as unknown as { reference: string | null }
    ).reference = transactionReference
  }

  const invoiceCoupon = await getCouponById(created.invoice.couponId)

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
    const txnRef = transactionReference ?? createTransactionReference()

    try {
      const session = await createCheckoutSessionForTransaction({
        planPricingId: orderResult.order.planPricingId,
        amountMinor: created.invoice.totalAmount,
        currency: created.invoice.currency,
        orderId: orderResult.order.id,
        invoiceId: created.invoice.id,
        transactionId: created.transaction.id,
        reference: txnRef,
        discount: invoiceCoupon,
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
    } catch (error) {
      await markTransactionSetupFailed(created.transaction.id, error)
      throw error
    }
  }

  if (input.method === "coingate_checkout") {
    const txnRef = transactionReference ?? createTransactionReference()
    const billing = orderResult.order.billingDetails
    try {
      const session = await createCoinGateOrderForTransaction({
        amountMinor: created.invoice.totalAmount,
        currency: created.invoice.currency,
        orderId: orderResult.order.id,
        invoiceId: created.invoice.id,
        transactionId: created.transaction.id,
        reference: txnRef,
        planName: created.order.planName,
        durationDays: created.order.durationDays,
        billingEmail: billing?.email ?? null,
        shopper: billing
          ? {
              ipAddress: input.ipAddress,
              firstName: billing.firstName,
              lastName: billing.lastName,
              email: billing.email,
              companyName: billing.companyName,
              taxId: billing.taxId,
              addressLine1: billing.addressLine1,
              addressLine2: billing.addressLine2,
              city: billing.city,
              state: billing.state,
              postalCode: billing.postalCode,
              country: billing.country,
            }
          : null,
      })

      await db
        .update(transactions)
        .set({
          metadata: {
            coingate_order_id: session.orderId,
            coingate_payment_url: session.paymentUrl,
            coingate_status: session.status,
            coingate_callback_token: session.callbackToken,
            coingate_environment: session.environment,
          } as unknown as typeof transactions.$inferInsert.metadata,
        })
        .where(eq(transactions.id, created.transaction.id))

      gatewayRedirectUrl = session.paymentUrl
    } catch (error) {
      await markTransactionSetupFailed(created.transaction.id, error)
      throw error
    }
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
  method?: "none" | "upi" | "usdt_trc20" | "dodo_checkout" | "coingate_checkout"
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
    "upi" | "usdt_trc20" | "dodo_checkout" | "coingate_checkout" | null
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

export async function confirmPendingTransaction(
  transactionId: number,
  input?: {
    adminUserId?: number | null
    reason?: string
    source?: "admin" | "webhook" | "system"
  }
) {
  const confirmation = await db.transaction(async (tx) => {
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
          couponId: invoices.couponId,
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

      if (existingInstance.status === "suspended") {
        throw new BillingError(400, "Cannot renew a suspended instance")
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

    if (current.invoice.couponId) {
      await tx
        .insert(couponUsages)
        .values({
          couponId: current.invoice.couponId,
          userId: current.transaction.userId,
          invoiceId: current.invoice.id,
        })
        .onConflictDoNothing()
    }

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
      before: {
        transactionStatus: current.transaction.status,
        invoiceStatus: current.invoice.status,
        orderStatus: current.order.status,
      },
    }
  })

  await sendPaymentConfirmedNotification({
    invoiceId: confirmation.invoice.id,
    transactionId: confirmation.transaction.id,
  })

  try {
    await createAdminAuditLog({
      adminUserId: input?.adminUserId ?? null,
      action: "transaction.confirm",
      entityType: "transaction",
      entityId: confirmation.transaction.id,
      reason:
        input?.reason ??
        (input?.adminUserId
          ? "Admin confirmed pending transaction"
          : "Payment confirmed"),
      beforeState: {
        transactionStatus: confirmation.before.transactionStatus,
        invoiceStatus: confirmation.before.invoiceStatus,
        orderStatus: confirmation.before.orderStatus,
      },
      afterState: {
        transactionStatus: confirmation.transaction.status,
        invoiceStatus: confirmation.invoice.status,
        orderStatus: confirmation.order.status,
      },
      metadata: {
        source: input?.source ?? "system",
        kind: confirmation.kind,
        instanceId: confirmation.instance?.id ?? null,
      },
    })
  } catch (auditError) {
    console.error("Failed to write transaction confirmation audit log", auditError)
  }

  return confirmation
}

export async function failPendingTransactionForUser(input: {
  userId: number
  transactionId: number
  reason: string
  source?: "provider_return" | "webhook" | "system"
}) {
  const failed = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        transaction: {
          id: transactions.id,
          userId: transactions.userId,
          invoiceId: transactions.invoiceId,
          status: transactions.status,
          failureReason: transactions.failureReason,
        },
        invoice: {
          id: invoices.id,
          status: invoices.status,
        },
        order: {
          id: orders.id,
          status: orders.status,
        },
      })
      .from(transactions)
      .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .where(eq(transactions.id, input.transactionId))
      .limit(1)

    if (!current) {
      throw new BillingError(404, "Transaction not found")
    }

    if (current.transaction.userId !== input.userId) {
      throw new BillingError(403, "Forbidden")
    }

    if (current.transaction.status === "confirmed") {
      throw new BillingError(400, "Confirmed transactions cannot be failed")
    }

    if (current.transaction.status === "failed") {
      return {
        transaction: current.transaction,
        invoice: current.invoice,
        order: current.order,
        changed: false,
      }
    }

    await tx
      .update(transactions)
      .set({
        status: "failed",
        failureReason: input.reason,
      })
      .where(eq(transactions.id, current.transaction.id))

    await tx
      .update(invoices)
      .set({
        status: "expired",
      })
      .where(eq(invoices.id, current.invoice.id))

    await tx
      .update(orders)
      .set({
        status: "cancelled",
      })
      .where(eq(orders.id, current.order.id))

    return {
      transaction: {
        ...current.transaction,
        status: "failed" as const,
        failureReason: input.reason,
      },
      invoice: {
        ...current.invoice,
        status: "expired" as const,
      },
      order: {
        ...current.order,
        status: "cancelled" as const,
      },
      changed: true,
    }
  })

  if (failed.changed) {
    await notifyPaymentFailureForInvoice({
      invoiceId: failed.invoice.id,
      reason: input.reason,
    })

    try {
      await createAdminAuditLog({
        adminUserId: null,
        action: "transaction.fail",
        entityType: "transaction",
        entityId: failed.transaction.id,
        reason: input.reason,
        beforeState: {
          transactionStatus: "pending",
          invoiceStatus: "unpaid",
          orderStatus: "pending_payment",
        },
        afterState: {
          transactionStatus: failed.transaction.status,
          invoiceStatus: failed.invoice.status,
          orderStatus: failed.order.status,
        },
        metadata: {
          source: input.source ?? "system",
        },
      })
    } catch (auditError) {
      console.error("Failed to write transaction failure audit log", auditError)
    }
  }

  return failed
}

export async function notifyPaymentFailureForInvoice(input: {
  invoiceId: number
  reason: string
}) {
  await sendPaymentFailedNotification({
    invoiceId: input.invoiceId,
    reason: input.reason,
  })

  try {
    await sendAdminAlertEmail({
      subject: `Payment failed for invoice #${input.invoiceId}`,
      text: `Invoice #${input.invoiceId} moved to failed/expired state. Reason: ${input.reason}`,
    })
  } catch (alertError) {
    console.error("Failed to send admin alert for payment failure", alertError)
  }
}

export async function sendExpiryReminderSweep(input?: {
  daysAhead?: number
  now?: Date
}) {
  const now = input?.now ?? new Date()
  const daysAhead = Math.max(1, Math.min(input?.daysAhead ?? 3, 30))
  const upperBound = new Date(now)
  upperBound.setDate(upperBound.getDate() + daysAhead)

  const rows = await db
    .select({
      instance: {
        id: instances.id,
        expiryDate: instances.expiryDate,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
      plan: {
        name: plans.name,
      },
    })
    .from(instances)
    .innerJoin(users, eq(instances.userId, users.id))
    .innerJoin(plans, eq(instances.planId, plans.id))
    .where(
      and(
        inArray(instances.status, ["active", "suspended"]),
        gte(instances.expiryDate, now),
        lt(instances.expiryDate, upperBound)
      )
    )

  let sent = 0

  for (const row of rows) {
    if (!row.instance.expiryDate) {
      continue
    }

    const diffMs = row.instance.expiryDate.getTime() - now.getTime()
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    try {
      await sendExpiryReminderEmail({
        to: row.user.email,
        firstName: row.user.firstName,
        instanceId: row.instance.id,
        planName: row.plan.name,
        expiryDate: row.instance.expiryDate,
        daysRemaining,
      })
      sent += 1
    } catch (emailError) {
      console.error("Failed to send expiry reminder email", emailError)
    }
  }

  return {
    sent,
    checked: rows.length,
    daysAhead,
  }
}
