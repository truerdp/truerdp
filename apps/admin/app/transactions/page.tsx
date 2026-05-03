"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"
import { useTransactions } from "@/hooks/use-transactions"
import { useConfirmTransaction } from "@/hooks/use-confirm-transaction"
import { ProvisionInstanceDialog } from "@/components/provision-instance-dialog"
import { AdminPaginationControls } from "@/components/admin-pagination-controls"
import { PendingTransactionsSkeleton, TransactionsEmpty } from "@/components/admin-transactions/states"
import { AdminTransactionsTable } from "@/components/admin-transactions/table"

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { data, isLoading, isError, error } = useTransactions({
    page,
    pageSize,
  })
  const confirmMutation = useConfirmTransaction()
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null
  )

  const transactions = Array.isArray(data?.items) ? data.items : []
  const pagination = data?.pagination
  const totalCount = pagination?.totalCount ?? 0
  const pageStart =
    totalCount === 0 || !pagination
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const pageEnd =
    totalCount === 0 || !pagination
      ? 0
      : Math.min(pageStart + transactions.length - 1, totalCount)

  const handleConfirmTransaction = async (transactionId: number) => {
    try {
      const response = await confirmMutation.mutateAsync(transactionId)

      // If this is a new order (not a renewal) and instance was created, provision it
      if (response.kind === "new_purchase" && response.instance?.id) {
        setSelectedInstanceId(response.instance.id)
        setProvisionDialogOpen(true)
      }
    } catch {
      // Error toast is handled in the mutation hook
    }
  }

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Review all transactions with pending ones prioritized for action.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <PendingTransactionsSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load transactions."}</span>
        </div>
      ) : totalCount === 0 ? (
        <div className="rounded-lg border">
          <TransactionsEmpty />
        </div>
      ) : (
        <div className="space-y-3">
          <AdminTransactionsTable
            transactions={transactions}
            isConfirming={confirmMutation.isPending}
            onConfirm={handleConfirmTransaction}
          />

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {pagination ? (
              <AdminPaginationControls
                page={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalCount={pagination.totalCount}
                pageStart={pageStart}
                pageEnd={pageEnd}
                onPageChange={setPage}
                onPageSizeChange={(value) => {
                  setPage(1)
                  setPageSize(value)
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      <ProvisionInstanceDialog
        open={provisionDialogOpen}
        instanceId={selectedInstanceId || 0}
        onOpenChange={setProvisionDialogOpen}
      />
    </section>
  )
}
