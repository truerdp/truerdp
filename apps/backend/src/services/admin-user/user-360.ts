import { desc, eq, sql } from "drizzle-orm"
import { db } from "../../db.js"
import {
  instanceExtensions,
  instances,
  orders,
  plans,
  resources,
  servers,
  users,
} from "../../schema.js"
import { listUserInvoices, listUserTransactions } from "../billing.js"
import { getDaysBetween, getLatestTimestamp, getStartOfDay } from "./shared.js"
import {
  getInstanceBreakdown,
  getInvoiceBreakdown,
  getSummaryCurrency,
  getTransactionBreakdown,
} from "./metrics.js"
import type { OrderBillingDetails } from "../../schema.js"

type StoredBillingUser = {
  firstName: string | null
  lastName: string | null
  email: string
  billingPhone: string | null
  billingCompanyName: string | null
  billingTaxId: string | null
  billingAddressLine1: string | null
  billingAddressLine2: string | null
  billingCity: string | null
  billingState: string | null
  billingPostalCode: string | null
  billingCountry: string | null
}

function requiredProfileValue(value: string | null, fallback?: string | null) {
  const trimmed = value?.trim() ?? ""
  if (trimmed.length > 0) {
    return trimmed
  }

  return fallback?.trim() ?? ""
}

function optionalProfileValue(value: string | null, fallback?: string | null) {
  const trimmed = value?.trim() ?? ""
  if (trimmed.length > 0) {
    return trimmed
  }

  const fallbackValue = fallback?.trim() ?? ""
  return fallbackValue.length > 0 ? fallbackValue : null
}

function buildStoredBillingProfile(
  user: StoredBillingUser,
  latestBillingDetails: OrderBillingDetails | null
) {
  return {
    firstName: requiredProfileValue(
      user.firstName,
      latestBillingDetails?.firstName
    ),
    lastName: requiredProfileValue(
      user.lastName,
      latestBillingDetails?.lastName
    ),
    email: requiredProfileValue(user.email, latestBillingDetails?.email),
    phone: requiredProfileValue(user.billingPhone, latestBillingDetails?.phone),
    companyName: optionalProfileValue(
      user.billingCompanyName,
      latestBillingDetails?.companyName
    ),
    taxId: optionalProfileValue(user.billingTaxId, latestBillingDetails?.taxId),
    addressLine1: requiredProfileValue(
      user.billingAddressLine1,
      latestBillingDetails?.addressLine1
    ),
    addressLine2: optionalProfileValue(
      user.billingAddressLine2,
      latestBillingDetails?.addressLine2
    ),
    city: requiredProfileValue(user.billingCity, latestBillingDetails?.city),
    state: requiredProfileValue(user.billingState, latestBillingDetails?.state),
    postalCode: requiredProfileValue(
      user.billingPostalCode,
      latestBillingDetails?.postalCode
    ),
    country: requiredProfileValue(
      user.billingCountry,
      latestBillingDetails?.country
    ),
  }
}

export async function getAdminUser360(userId: number) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      billingPhone: users.billingPhone,
      billingCompanyName: users.billingCompanyName,
      billingTaxId: users.billingTaxId,
      billingAddressLine1: users.billingAddressLine1,
      billingAddressLine2: users.billingAddressLine2,
      billingCity: users.billingCity,
      billingState: users.billingState,
      billingPostalCode: users.billingPostalCode,
      billingCountry: users.billingCountry,
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
    const expiryDate = instance.expiryDate
      ? new Date(instance.expiryDate)
      : null
    const normalizedExpiryDate =
      expiryDate && !Number.isNaN(expiryDate.getTime())
        ? getStartOfDay(expiryDate)
        : null

    const daysUntilExpiry =
      normalizedExpiryDate != null
        ? getDaysBetween(normalizedExpiryDate, today)
        : null
    const daysSinceExpiry =
      normalizedExpiryDate != null
        ? getDaysBetween(today, normalizedExpiryDate)
        : null

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

  const { paidInvoices, unpaidInvoices, expiredInvoices } =
    getInvoiceBreakdown(invoices)
  const { confirmedTransactions, pendingTransactions, failedTransactions } =
    getTransactionBreakdown(transactions)
  const {
    activeInstances,
    expiredInstances,
    terminatedInstances,
    pendingInstances,
    totalExtensions,
  } = getInstanceBreakdown(mappedInstances)
  const currency = getSummaryCurrency(paidInvoices, invoices, transactions)

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
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
      totalExtensions,
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
    billingProfile: buildStoredBillingProfile(
      user,
      latestBillingOrder?.billingDetails ?? null
    ),
    latestBillingDetails: latestBillingOrder?.billingDetails ?? null,
    latestBillingCapturedAt: latestBillingOrder?.createdAt ?? null,
    instances: mappedInstances,
    invoices,
    transactions,
  }
}
