import { eq, inArray } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders, plans, resources, servers, transactions, users } from "../../schema.js"

export function buildTransactionSummaryQuery() {
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

type TransactionSummaryRow = Awaited<
  ReturnType<ReturnType<typeof buildTransactionSummaryQuery>["orderBy"]>
>[number]

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

  return new Map(linkedResources.map((resource) => [resource.instanceId, resource]))
}

export async function mapTransactionSummaries(rows: TransactionSummaryRow[]) {
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
