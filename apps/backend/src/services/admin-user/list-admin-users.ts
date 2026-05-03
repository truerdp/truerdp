import { desc, eq, sql } from "drizzle-orm"
import { db } from "../../db.js"
import { instances, invoices, orders, transactions, users } from "../../schema.js"
import { getLatestTimestamp } from "./shared.js"

export async function listAdminUsers() {
  const [
    userRows,
    orderStatsRows,
    invoiceStatsRows,
    transactionStatsRows,
    instanceStatsRows,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db
      .select({
        userId: orders.userId,
        totalOrders: sql<number>`count(*)::int`,
        lastOrderAt: sql<string | null>`max(${orders.createdAt})::text`,
        hasBillingProfile: sql<boolean>`coalesce(bool_or(${orders.billingDetails} is not null), false)`,
      })
      .from(orders)
      .groupBy(orders.userId),
    db
      .select({
        userId: orders.userId,
        totalInvoices: sql<number>`count(*)::int`,
        unpaidInvoices: sql<number>`count(*) filter (where ${invoices.status} = 'unpaid')::int`,
        totalSpentCents: sql<number>`coalesce(sum(case when ${invoices.status} = 'paid' then ${invoices.totalAmount} else 0 end), 0)::int`,
        lastInvoiceAt: sql<string | null>`max(${invoices.createdAt})::text`,
      })
      .from(orders)
      .innerJoin(invoices, eq(invoices.orderId, orders.id))
      .groupBy(orders.userId),
    db
      .select({
        userId: transactions.userId,
        totalTransactions: sql<number>`count(*)::int`,
        confirmedTransactions: sql<number>`count(*) filter (where ${transactions.status} = 'confirmed')::int`,
        lastTransactionAt: sql<string | null>`max(${transactions.createdAt})::text`,
      })
      .from(transactions)
      .groupBy(transactions.userId),
    db
      .select({
        userId: instances.userId,
        activeInstances: sql<number>`count(*) filter (where ${instances.status} = 'active')::int`,
        totalInstances: sql<number>`count(*)::int`,
        lastInstanceAt: sql<string | null>`max(${instances.updatedAt})::text`,
      })
      .from(instances)
      .groupBy(instances.userId),
  ])

  const orderStatsByUserId = new Map(
    orderStatsRows.map((row) => [row.userId, row] as const)
  )
  const invoiceStatsByUserId = new Map(
    invoiceStatsRows.map((row) => [row.userId, row] as const)
  )
  const transactionStatsByUserId = new Map(
    transactionStatsRows.map((row) => [row.userId, row] as const)
  )
  const instanceStatsByUserId = new Map(
    instanceStatsRows.map((row) => [row.userId, row] as const)
  )

  return userRows.map((userRow) => {
    const orderStats = orderStatsByUserId.get(userRow.id)
    const invoiceStats = invoiceStatsByUserId.get(userRow.id)
    const transactionStats = transactionStatsByUserId.get(userRow.id)
    const instanceStats = instanceStatsByUserId.get(userRow.id)

    return {
      ...userRow,
      totalOrders: orderStats?.totalOrders ?? 0,
      totalInvoices: invoiceStats?.totalInvoices ?? 0,
      unpaidInvoices: invoiceStats?.unpaidInvoices ?? 0,
      totalTransactions: transactionStats?.totalTransactions ?? 0,
      confirmedTransactions: transactionStats?.confirmedTransactions ?? 0,
      activeInstances: instanceStats?.activeInstances ?? 0,
      totalInstances: instanceStats?.totalInstances ?? 0,
      totalSpentCents: invoiceStats?.totalSpentCents ?? 0,
      hasBillingProfile: orderStats?.hasBillingProfile ?? false,
      lastActivityAt: getLatestTimestamp([
        userRow.updatedAt,
        orderStats?.lastOrderAt,
        invoiceStats?.lastInvoiceAt,
        transactionStats?.lastTransactionAt,
        instanceStats?.lastInstanceAt,
      ]),
    }
  })
}
