import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  CreditCardIcon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"

type SummaryCardsProps = {
  activeInstances: number
  expiringSoonCount: number
  pendingTransactions: number
}

export function SummaryCards({
  activeInstances,
  expiringSoonCount,
  pendingTransactions,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-4">
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={ServerStack01Icon} size={16} strokeWidth={2} />
          Active Instances
        </div>
        <p className="text-2xl font-semibold">{activeInstances}</p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Alert02Icon} size={16} strokeWidth={2} />
          Expiring Soon
        </div>
        <p className="text-2xl font-semibold">{expiringSoonCount}</p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={2} />
          Pending Transactions
        </div>
        <p className="text-2xl font-semibold">{pendingTransactions}</p>
      </div>
    </div>
  )
}
