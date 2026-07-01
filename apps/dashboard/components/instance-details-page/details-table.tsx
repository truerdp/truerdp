import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"
import type { ReactNode } from "react"

import CredentialsDialog from "@/components/credentials-dialog"
import RenewButton from "@/components/renew-button"
import { formatAmount } from "@/lib/format"
import { cn } from "@workspace/ui/lib/utils"
import type { InstanceDetailsData } from "@/hooks/use-instance"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  formatDate,
  formatStatus,
  getBillingStatusVariant,
  getStatusVariant,
  type BillingStatus,
} from "@/components/instance-details-page/helpers"
import type { InstanceTransaction } from "@/hooks/use-instance-transactions"

type InstanceDetailsTableProps = {
  data: InstanceDetailsData
  hasPendingRenewal: boolean
  latestPendingTransaction: InstanceTransaction | undefined
  canShowRenew: boolean
  canRenew: boolean
  isExpired: boolean
  billingStatus: BillingStatus
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-right text-sm">{value}</span>
      </div>
      <Separator />
    </>
  )
}

export function InstanceDetailsTable({
  data,
  hasPendingRenewal,
  latestPendingTransaction,
  canShowRenew,
  canRenew,
  isExpired,
  billingStatus,
}: InstanceDetailsTableProps) {
  return (
    <>
      {hasPendingRenewal && (
        <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4 text-yellow-700"
          />
          <AlertTitle className="text-sm font-medium">
            Renewal requested (#{latestPendingTransaction?.id} -{" "}
            {formatAmount(latestPendingTransaction?.amount ?? 0)}). Awaiting
            admin confirmation.
          </AlertTitle>
          {latestPendingTransaction && (
            <AlertDescription className="text-xs text-yellow-800">
              Requested on{" "}
              {format(
                new Date(latestPendingTransaction.createdAt),
                "MMM d, yyyy p"
              )}
            </AlertDescription>
          )}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instance #{data.id}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusVariant(data.status)} className="uppercase">
                Status: {formatStatus(data.status)}
              </Badge>
              <Badge
                variant={getBillingStatusVariant(billingStatus)}
                className="uppercase"
              >
                Billing: {formatStatus(billingStatus)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CredentialsDialog instanceId={data.id} />
              {canShowRenew && (
                <RenewButton instanceId={data.id} disabled={!canRenew} />
              )}
            </div>
          </div>
          <Separator />
          <Row
            label="IP Address"
            value={<span className="font-mono">{data.ipAddress ?? "-"}</span>}
          />
          <Row
            label="Username"
            value={<span className="font-mono">{data.username ?? "-"}</span>}
          />
          <Row label="Start Date" value={formatDate(data.startDate)} />
          <Row
            label="Expiry Date"
            value={
              <span className={cn("font-medium", isExpired && "text-red-500")}>
                {formatDate(data.expiryDate)}
                {isExpired ? " (expired)" : ""}
              </span>
            }
          />
        </CardContent>
      </Card>
    </>
  )
}
