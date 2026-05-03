import { and, desc, eq, sql, type SQL } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders, transactions, users } from "../../schema.js"

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

  const latestTransactionStatusSql = sql<"pending" | "confirmed" | "failed" | null>`(
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
    conditions.push(sql`${latestTransactionStatusSql} = ${params.transactionStatus}`)
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
