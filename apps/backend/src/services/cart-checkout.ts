import { eq } from "drizzle-orm"
import { db } from "../db.js"
import { cartItems, invoices, orderItems, orders, users } from "../schema.js"
import {
  BillingError,
  buildOrderPriceInsertValue,
  createInvoiceExpiry,
  createInvoiceNumber,
  requireInsertedRecord,
} from "./billing/shared.js"
import { buildUserBillingDetails } from "./billing/user-billing.js"
import { sendInvoiceCreatedNotification } from "./billing/notifications.js"
import { listCartLines } from "./cart.js"

export async function checkoutCartForUser(userId: number) {
  const cartLines = await listCartLines(userId)

  if (cartLines.length === 0) {
    throw new BillingError(400, "Cart is empty")
  }

  const inactiveLine = cartLines.find((line) => !line.isActive)

  if (inactiveLine) {
    throw new BillingError(
      400,
      `${inactiveLine.planName} is no longer available`
    )
  }

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

  const firstLine = cartLines[0]

  if (!firstLine) {
    throw new BillingError(400, "Cart is empty")
  }

  const subtotal = cartLines.reduce(
    (total, line) => total + line.lineTotalUsdCents,
    0
  )
  const itemCount = cartLines.reduce((total, line) => total + line.quantity, 0)
  const billingDetails = buildUserBillingDetails(billingUser)
  const orderLabel =
    cartLines.length === 1 && firstLine.quantity === 1
      ? firstLine.planName
      : `${itemCount} TrueRDP services`
  const now = new Date()

  const created = await db.transaction(async (tx) => {
    const insertedOrders = await tx
      .insert(orders)
      .values({
        userId,
        planId: firstLine.planId,
        planPricingId: firstLine.planPricingId,
        renewalInstanceId: null,
        kind: "new_purchase",
        planName: orderLabel,
        ...buildOrderPriceInsertValue(firstLine.priceUsdCents),
        durationDays: firstLine.durationDays,
        billingDetails,
        status: "pending_payment",
      } as typeof orders.$inferInsert)
      .returning()

    const order = requireInsertedRecord(insertedOrders[0], "order")

    await tx.insert(orderItems).values(
      cartLines.map((line) => ({
        orderId: order.id,
        planId: line.planId,
        planPricingId: line.planPricingId,
        planName: line.planName,
        planPriceUsdCents: line.priceUsdCents,
        durationDays: line.durationDays,
        quantity: line.quantity,
      }))
    )

    const insertedInvoices = await tx
      .insert(invoices)
      .values({
        orderId: order.id,
        invoiceNumber: createInvoiceNumber(),
        subtotal,
        discount: 0,
        totalAmount: subtotal,
        status: "unpaid",
        expiresAt: createInvoiceExpiry(now),
      })
      .returning({ id: invoices.id })

    const invoice = requireInsertedRecord(insertedInvoices[0], "invoice")

    await tx.delete(cartItems).where(eq(cartItems.userId, userId))

    return { orderId: order.id, invoiceId: invoice.id }
  })

  await sendInvoiceCreatedNotification(created.invoiceId)

  return created
}
