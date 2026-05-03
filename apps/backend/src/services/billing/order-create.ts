import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { instances, invoices, orders } from "../../schema.js"
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

    const isExpired = instance.expiryDate != null && instance.expiryDate < new Date()

    if (instance.status === "suspended") {
      throw new BillingError(400, "Suspended instances cannot be renewed")
    }

    if (!["active", "expired"].includes(instance.status) && !isExpired) {
      throw new BillingError(400, "Instance is not eligible for renewal")
    }
  }

  const planPriceUsdCents =
    pricingSelection.priceUsdCents ?? (pricingSelection as { price?: number }).price

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
