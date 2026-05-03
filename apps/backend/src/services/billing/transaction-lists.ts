import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders, transactions } from "../../schema.js"
import {
  buildTransactionSummaryQuery,
  mapTransactionSummaries,
} from "./transaction-summary.js"

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

export async function listInstanceTransactions(userId: number, instanceId: number) {
  const rows = await buildTransactionSummaryQuery()
    .where(
      and(eq(transactions.userId, userId), eq(transactions.instanceId, instanceId))
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
