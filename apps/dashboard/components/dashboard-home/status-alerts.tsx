import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ClockAlertIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"

import { dashboardPaths } from "@/lib/paths"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { buttonVariants } from "@workspace/ui/components/button"

type StatusAlertsProps = {
  expiringSoonCount: number
  pendingTransactions: number
}

export function StatusAlerts({
  expiringSoonCount,
  pendingTransactions,
}: StatusAlertsProps) {
  return (
    <>
      {expiringSoonCount > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <HugeiconsIcon icon={ClockAlertIcon} size={18} strokeWidth={2} />
          <AlertTitle className="text-amber-900">
            {expiringSoonCount} instance{expiringSoonCount > 1 ? "s" : ""}{" "}
            expiring soon
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            Renew or review your instances before they expire.
          </AlertDescription>
          <AlertAction>
            <Link
              href={dashboardPaths.instances}
              className={buttonVariants({
                variant: "outline",
                size: "default",
              })}
            >
              Manage
            </Link>
          </AlertAction>
        </Alert>
      )}

      {pendingTransactions > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <HugeiconsIcon icon={CreditCardIcon} size={18} strokeWidth={2} />
          <AlertTitle className="text-amber-900">
            You have {pendingTransactions} pending transaction
            {pendingTransactions > 1 ? "s" : ""}
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            Review payment details and confirmation status in your transaction
            history.
          </AlertDescription>
          <AlertAction>
            <Link
              href={dashboardPaths.transactions}
              className={buttonVariants({
                variant: "outline",
                size: "default",
              })}
            >
              Review
            </Link>
          </AlertAction>
        </Alert>
      )}
    </>
  )
}
