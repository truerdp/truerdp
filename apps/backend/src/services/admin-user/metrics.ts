type InvoiceLike = {
  status: string
  totalAmount: number
  currency: string
}

type TransactionLike = {
  status: string
  invoice: {
    currency: string
  } | null
}

type InstanceLike = {
  status: string
  isExpiringSoon: boolean
  extensionCount: number
}

export function getInvoiceBreakdown<T extends InvoiceLike>(invoices: T[]) {
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid")
  const unpaidInvoices = invoices.filter((invoice) => invoice.status === "unpaid")
  const expiredInvoices = invoices.filter((invoice) => invoice.status === "expired")

  return {
    paidInvoices,
    unpaidInvoices,
    expiredInvoices,
  }
}

export function getTransactionBreakdown<T extends TransactionLike>(
  transactions: T[]
) {
  const confirmedTransactions = transactions.filter(
    (transaction) => transaction.status === "confirmed"
  )
  const pendingTransactions = transactions.filter(
    (transaction) => transaction.status === "pending"
  )
  const failedTransactions = transactions.filter(
    (transaction) => transaction.status === "failed"
  )

  return {
    confirmedTransactions,
    pendingTransactions,
    failedTransactions,
  }
}

export function getInstanceBreakdown<T extends InstanceLike>(
  instances: T[]
) {
  const activeInstances = instances.filter((instance) => instance.status === "active")
  const expiredInstances = instances.filter((instance) => instance.status === "expired")
  const terminatedInstances = instances.filter(
    (instance) => instance.status === "terminated"
  )
  const pendingInstances = instances.filter(
    (instance) =>
      instance.status === "pending" || instance.status === "provisioning"
  )

  return {
    activeInstances,
    expiredInstances,
    terminatedInstances,
    pendingInstances,
    totalExtensions: instances.reduce(
      (sum, instance) => sum + instance.extensionCount,
      0
    ),
  }
}

export function getSummaryCurrency(
  paidInvoices: InvoiceLike[],
  invoices: InvoiceLike[],
  transactions: TransactionLike[]
) {
  return (
    paidInvoices[0]?.currency ??
    invoices[0]?.currency ??
    transactions[0]?.invoice?.currency ??
    "USD"
  )
}

