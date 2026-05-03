import { createAdminAuditLog } from "../admin-audit.js"
import { sendPaymentConfirmedNotification } from "./notifications.js"
import { confirmPendingTransactionCore } from "./transaction-confirm-core.js"

export async function confirmPendingTransaction(
  transactionId: number,
  input?: {
    adminUserId?: number | null
    reason?: string
    source?: "admin" | "webhook" | "system"
  }
) {
  const confirmation = await confirmPendingTransactionCore(transactionId)

  await sendPaymentConfirmedNotification({
    invoiceId: confirmation.invoice.id,
    transactionId: confirmation.transaction.id,
  })

  try {
    await createAdminAuditLog({
      adminUserId: input?.adminUserId ?? null,
      action: "transaction.confirm",
      entityType: "transaction",
      entityId: confirmation.transaction.id,
      reason:
        input?.reason ??
        (input?.adminUserId
          ? "Admin confirmed pending transaction"
          : "Payment confirmed"),
      beforeState: {
        transactionStatus: confirmation.before.transactionStatus,
        invoiceStatus: confirmation.before.invoiceStatus,
        orderStatus: confirmation.before.orderStatus,
      },
      afterState: {
        transactionStatus: confirmation.transaction.status,
        invoiceStatus: confirmation.invoice.status,
        orderStatus: confirmation.order.status,
      },
      metadata: {
        source: input?.source ?? "system",
        kind: confirmation.kind,
        instanceId: confirmation.instance?.id ?? null,
      },
    })
  } catch (auditError) {
    console.error("Failed to write transaction confirmation audit log", auditError)
  }

  return confirmation
}
