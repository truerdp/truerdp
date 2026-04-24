import { desc, eq, sql } from "drizzle-orm"
import { db } from "../db.js"
import {
  instanceExtensions,
  instances,
  invoices,
  orders,
  plans,
  resources,
  servers,
  transactions,
  users,
} from "../schema.js"
import { listUserInvoices, listUserTransactions } from "./billing.js"

function getStartOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function getDaysBetween(later: Date, earlier: Date) {
  return Math.floor(
    (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24)
  )
}

function getLatestTimestamp(
  values: Array<Date | string | null | undefined>
): string | null {
  let latest: Date | null = null

  for (const value of values) {
    if (!value) {
      continue
    }

    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
      continue
    }

    if (!latest || date > latest) {
      latest = date
    }
  }

  return latest ? latest.toISOString() : null
}

export async function listAdminUsers() {
  const [userRows, orderStatsRows, invoiceStatsRows, transactionStatsRows, instanceStatsRows] =
    await Promise.all([
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

export async function getAdminUser360(userId: number) {
  const [user] = await db
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
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return null
  }

  const [orderRows, instanceRows, invoices, transactions] = await Promise.all([
    db
      .select({
        id: orders.id,
        status: orders.status,
        kind: orders.kind,
        billingDetails: orders.billingDetails,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt)),
    db
      .select({
        id: instances.id,
        userId: instances.userId,
        originOrderId: instances.originOrderId,
        planId: instances.planId,
        status: instances.status,
        startDate: instances.startDate,
        expiryDate: instances.expiryDate,
        terminatedAt: instances.terminatedAt,
        provisionAttempts: instances.provisionAttempts,
        lastProvisionError: instances.lastProvisionError,
        createdAt: instances.createdAt,
        updatedAt: instances.updatedAt,
        plan: {
          id: plans.id,
          name: plans.name,
          cpu: plans.cpu,
          ram: plans.ram,
          storage: plans.storage,
        },
        resource: {
          id: resources.id,
          username: resources.username,
          status: resources.status,
          assignedAt: resources.assignedAt,
          releasedAt: resources.releasedAt,
        },
        server: {
          id: servers.id,
          provider: servers.provider,
          ipAddress: servers.ipAddress,
          status: servers.status,
        },
        extensionCount: sql<number>`(
          select count(*)::int
          from ${instanceExtensions} ie
          where ie.instance_id = ${instances.id}
        )`,
        lastExtensionAt: sql<string | null>`(
          select ie.created_at::text
          from ${instanceExtensions} ie
          where ie.instance_id = ${instances.id}
          order by ie.created_at desc
          limit 1
        )`,
        lastExtensionDays: sql<number | null>`(
          select ie.days_extended
          from ${instanceExtensions} ie
          where ie.instance_id = ${instances.id}
          order by ie.created_at desc
          limit 1
        )`,
      })
      .from(instances)
      .leftJoin(plans, eq(instances.planId, plans.id))
      .leftJoin(resources, eq(resources.instanceId, instances.id))
      .leftJoin(servers, eq(resources.serverId, servers.id))
      .where(eq(instances.userId, userId))
      .orderBy(desc(instances.createdAt)),
    listUserInvoices(userId),
    listUserTransactions(userId),
  ])

  const today = getStartOfDay(new Date())

  const mappedInstances = instanceRows.map((instance) => {
    const expiryDate = instance.expiryDate ? new Date(instance.expiryDate) : null
    const normalizedExpiryDate =
      expiryDate && !Number.isNaN(expiryDate.getTime())
        ? getStartOfDay(expiryDate)
        : null

    const daysUntilExpiry =
      normalizedExpiryDate != null ? getDaysBetween(normalizedExpiryDate, today) : null
    const daysSinceExpiry =
      normalizedExpiryDate != null ? getDaysBetween(today, normalizedExpiryDate) : null

    return {
      ...instance,
      plan: instance.plan ?? null,
      resource: instance.resource ?? null,
      server: instance.server ?? null,
      daysUntilExpiry,
      daysSinceExpiry,
      isExpiringSoon:
        instance.status === "active" &&
        daysUntilExpiry != null &&
        daysUntilExpiry >= 0 &&
        daysUntilExpiry < 3,
    }
  })

  const latestBillingOrder =
    orderRows.find((order) => order.billingDetails != null) ?? null

  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid")
  const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid")
  const expiredInvoices = invoices.filter((invoice) => invoice.status === "expired")

  const confirmedTransactions = transactions.filter(
    (transaction) => transaction.status === "confirmed"
  )
  const pendingTransactions = transactions.filter(
    (transaction) => transaction.status === "pending"
  )
  const failedTransactions = transactions.filter(
    (transaction) => transaction.status === "failed"
  )

  const activeInstances = mappedInstances.filter(
    (instance) => instance.status === "active"
  )
  const expiredInstances = mappedInstances.filter(
    (instance) => instance.status === "expired"
  )
  const terminatedInstances = mappedInstances.filter(
    (instance) => instance.status === "terminated"
  )
  const pendingInstances = mappedInstances.filter(
    (instance) =>
      instance.status === "pending" || instance.status === "provisioning"
  )

  const currency =
    paidInvoices[0]?.currency ??
    invoices[0]?.currency ??
    transactions[0]?.invoice.currency ??
    "USD"

  return {
    user,
    summary: {
      totalOrders: orderRows.length,
      newPurchases: orderRows.filter((order) => order.kind === "new_purchase")
        .length,
      renewals: orderRows.filter((order) => order.kind === "renewal").length,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      expiredInvoices: expiredInvoices.length,
      totalTransactions: transactions.length,
      confirmedTransactions: confirmedTransactions.length,
      pendingTransactions: pendingTransactions.length,
      failedTransactions: failedTransactions.length,
      totalSpentCents: paidInvoices.reduce(
        (sum, invoice) => sum + invoice.totalAmount,
        0
      ),
      outstandingCents: unpaidInvoices.reduce(
        (sum, invoice) => sum + invoice.totalAmount,
        0
      ),
      currency,
      activeInstances: activeInstances.length,
      expiringSoonInstances: activeInstances.filter(
        (instance) => instance.isExpiringSoon
      ).length,
      expiredInstances: expiredInstances.length,
      terminatedInstances: terminatedInstances.length,
      pendingInstances: pendingInstances.length,
      totalExtensions: mappedInstances.reduce(
        (sum, instance) => sum + instance.extensionCount,
        0
      ),
      lastActivityAt: getLatestTimestamp([
        user.updatedAt,
        ...orderRows.map((order) => order.createdAt),
        ...mappedInstances.flatMap((instance) => [
          instance.createdAt,
          instance.updatedAt,
          instance.terminatedAt,
          instance.lastExtensionAt,
        ]),
        ...invoices.flatMap((invoice) => [invoice.createdAt, invoice.paidAt]),
        ...transactions.flatMap((transaction) => [
          transaction.createdAt,
          transaction.confirmedAt,
        ]),
      ]),
    },
    latestBillingDetails: latestBillingOrder?.billingDetails ?? null,
    latestBillingCapturedAt: latestBillingOrder?.createdAt ?? null,
    instances: mappedInstances,
    invoices,
    transactions,
  }
}
