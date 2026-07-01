import { and, desc, eq, or, sql, type SQL } from "drizzle-orm"
import { db } from "../../db.js"
import { instances, invoices, orders, plans, users } from "../../schema.js"

export type AdminOrderListParams = {
  page: number
  pageSize: number
  search?: string
  orderStatus?: "pending_payment" | "processing" | "completed" | "cancelled"
  invoiceStatus?: "none" | "unpaid" | "paid" | "expired"
  kind?: "new_purchase" | "renewal"
}

type OrderListRow = {
  order: {
    id: number
    userId: number
    kind: "new_purchase" | "renewal"
    status: "pending_payment" | "processing" | "completed" | "cancelled"
    billingDetails: unknown
    planName: string
    planPriceUsdCents: number
    durationDays: number
    createdAt: Date
    updatedAt: Date
  }
  plan: {
    id: number
    cpu: number
    ram: number
    storage: number
  }
  invoice: {
    id: number
    invoiceNumber: string
    status: "unpaid" | "paid" | "expired"
    totalAmount: number
    currency: string
    paidAt: Date | null
    expiresAt: Date
  } | null
  instance: {
    id: number
    status: string
  } | null
}

function mapOrderRow(row: OrderListRow) {
  return {
    id: row.order.id,
    userId: row.order.userId,
    kind: row.order.kind,
    status: row.order.status,
    billingDetails: row.order.billingDetails,
    createdAt: row.order.createdAt,
    updatedAt: row.order.updatedAt,
    plan: {
      id: row.plan.id,
      name: row.order.planName,
      cpu: row.plan.cpu,
      ram: row.plan.ram,
      storage: row.plan.storage,
      durationDays: row.order.durationDays,
      priceUsdCents: row.order.planPriceUsdCents,
    },
    invoice: row.invoice
      ? {
          id: row.invoice.id,
          invoiceNumber: row.invoice.invoiceNumber,
          status: row.invoice.status,
          totalAmount: row.invoice.totalAmount,
          currency: row.invoice.currency,
          paidAt: row.invoice.paidAt,
          expiresAt: row.invoice.expiresAt,
        }
      : null,
    instance: row.instance
      ? {
          id: row.instance.id,
          status: row.instance.status,
        }
      : null,
  }
}

const orderInstanceJoinCondition = or(
  eq(instances.originOrderId, orders.id),
  eq(instances.id, orders.renewalInstanceId)
)

export async function listUserOrders(userId: number) {
  const rows = await db
    .select({
      order: {
        id: orders.id,
        userId: orders.userId,
        kind: orders.kind,
        status: orders.status,
        billingDetails: orders.billingDetails,
        planName: orders.planName,
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      },
      plan: {
        id: plans.id,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        paidAt: invoices.paidAt,
        expiresAt: invoices.expiresAt,
      },
      instance: {
        id: instances.id,
        status: instances.status,
      },
    })
    .from(orders)
    .innerJoin(plans, eq(orders.planId, plans.id))
    .leftJoin(invoices, eq(invoices.orderId, orders.id))
    .leftJoin(instances, orderInstanceJoinCondition)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))

  return rows.map(mapOrderRow)
}

export async function getAdminOrderById(orderId: number) {
  const rows = await db
    .select({
      order: {
        id: orders.id,
        userId: orders.userId,
        kind: orders.kind,
        status: orders.status,
        billingDetails: orders.billingDetails,
        planName: orders.planName,
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      },
      plan: {
        id: plans.id,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        paidAt: invoices.paidAt,
        expiresAt: invoices.expiresAt,
      },
      instance: {
        id: instances.id,
        status: instances.status,
      },
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(orders)
    .innerJoin(plans, eq(orders.planId, plans.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(invoices, eq(invoices.orderId, orders.id))
    .leftJoin(instances, orderInstanceJoinCondition)
    .where(eq(orders.id, orderId))
    .limit(1)

  const row = rows[0]

  return row
    ? {
        ...mapOrderRow(row),
        user: row.user,
      }
    : null
}

export async function listAdminOrders(params: AdminOrderListParams) {
  const conditions: SQL[] = []

  if (params.orderStatus) {
    conditions.push(eq(orders.status, params.orderStatus))
  }

  if (params.kind) {
    conditions.push(eq(orders.kind, params.kind))
  }

  if (params.invoiceStatus === "none") {
    conditions.push(sql`${invoices.id} is null`)
  } else if (params.invoiceStatus) {
    conditions.push(eq(invoices.status, params.invoiceStatus))
  }

  const normalizedSearch = params.search?.trim()

  if (normalizedSearch) {
    const pattern = `%${normalizedSearch}%`
    conditions.push(sql`(
      cast(${orders.id} as text) ilike ${pattern}
      or cast(${orders.userId} as text) ilike ${pattern}
      or ${orders.planName} ilike ${pattern}
      or ${users.firstName} ilike ${pattern}
      or ${users.lastName} ilike ${pattern}
      or ${users.email} ilike ${pattern}
      or coalesce(${invoices.invoiceNumber}, '') ilike ${pattern}
    )`)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const countResult = await db
    .select({ totalCount: sql<number>`count(*)::int` })
    .from(orders)
    .innerJoin(plans, eq(orders.planId, plans.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(invoices, eq(invoices.orderId, orders.id))
    .where(whereClause)

  const totalCount = countResult[0]?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / params.pageSize)
  const page = totalPages > 0 ? Math.min(params.page, totalPages) : 1
  const offset = (page - 1) * params.pageSize

  const rows = await db
    .select({
      order: {
        id: orders.id,
        userId: orders.userId,
        kind: orders.kind,
        status: orders.status,
        billingDetails: orders.billingDetails,
        planName: orders.planName,
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      },
      plan: {
        id: plans.id,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        paidAt: invoices.paidAt,
        expiresAt: invoices.expiresAt,
      },
      instance: {
        id: instances.id,
        status: instances.status,
      },
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(orders)
    .innerJoin(plans, eq(orders.planId, plans.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(invoices, eq(invoices.orderId, orders.id))
    .leftJoin(instances, orderInstanceJoinCondition)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(params.pageSize)
    .offset(offset)

  return {
    items: rows.map((row) => ({
      ...mapOrderRow(row),
      user: row.user,
    })),
    pagination: {
      page,
      pageSize: params.pageSize,
      totalCount,
      totalPages,
    },
  }
}
