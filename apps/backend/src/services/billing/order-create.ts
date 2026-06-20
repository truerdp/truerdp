import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { instances, invoices, orderItems, orders, users } from "../../schema.js"
import { calculatePrice } from "../pricing.js"
import { sendInvoiceCreatedNotification } from "./notifications.js"
import { formatBillingOrderResponse } from "./order-query.js"
import { getPlanPricingById } from "./pricing.js"
import {
  BillingError,
  buildOrderPriceInsertValue,
  createInvoiceExpiry,
  createInvoiceNumber,
  getOrderPlanPriceUsdCents,
  requireInsertedRecord,
} from "./shared.js"
import { buildUserBillingDetails } from "./user-billing.js"

async function getBillingUser(userId: number) {
  const [billingUser] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      billingPhone: users.billingPhone,
      billingCompanyName: users.billingCompanyName,
      billingTaxId: users.billingTaxId,
      billingAddressLine1: users.billingAddressLine1,
      billingAddressLine2: users.billingAddressLine2,
      billingCity: users.billingCity,
      billingState: users.billingState,
      billingPostalCode: users.billingPostalCode,
      billingCountry: users.billingCountry,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!billingUser) {
    throw new BillingError(404, "User not found")
  }

  return billingUser
}

async function assertRenewalEligible(input: {
  userId: number
  instanceId: number
  planId: number
}) {
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

  if (instance.planId !== input.planId) {
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

  const billingUser = await getBillingUser(input.userId)
  const billingDetails = buildUserBillingDetails(billingUser)

  if (!billingDetails) {
    throw new BillingError(
      400,
      "Complete your billing address before starting checkout"
    )
  }

  const orderKind = input.instanceId ? "renewal" : "new_purchase"

  if (input.instanceId != null) {
    await assertRenewalEligible({
      userId: input.userId,
      instanceId: input.instanceId,
      planId: pricingSelection.planId,
    })
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
      billingDetails,
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

    await tx.insert(orderItems).values({
      orderId: order.id,
      planId: pricingSelection.plan.id,
      planPricingId: pricingSelection.id,
      planName: pricingSelection.plan.name,
      planPriceUsdCents: orderPlanPriceUsdCentsValue,
      durationDays: pricingSelection.durationDays,
      quantity: 1,
    })

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
    items: [
      {
        id: created.order.id,
        planId: pricingSelection.plan.id,
        planPricingId: pricingSelection.id,
        planName: pricingSelection.plan.name,
        planPriceUsdCents: planPriceUsdCentsValue,
        durationDays: pricingSelection.durationDays,
        quantity: 1,
        lineTotalUsdCents: planPriceUsdCentsValue,
      },
    ],
    plan: {
      id: pricingSelection.plan.id,
      name: pricingSelection.plan.name,
      cpu: pricingSelection.plan.cpu,
      ram: pricingSelection.plan.ram,
      storage: pricingSelection.plan.storage,
    },
  })
}
