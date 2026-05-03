import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
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
            className="h-4 w-4 text-yellow-700"
          />
          <AlertTitle className="text-sm font-medium">
            Renewal requested (#{latestPendingTransaction?.id} •{" "}
            {formatAmount(latestPendingTransaction?.amount ?? 0)}). Awaiting
            admin confirmation.
          </AlertTitle>
          {latestPendingTransaction && (
            <AlertDescription className="text-xs text-yellow-800">
              Requested on{" "}
              {format(new Date(latestPendingTransaction.createdAt), "MMM d, yyyy p")}
            </AlertDescription>
          )}
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-sm">{data.id}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(data.status)}>
                  {formatStatus(data.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getBillingStatusVariant(billingStatus)}>
                  {formatStatus(billingStatus)}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">{data.ipAddress ?? "-"}</TableCell>
              <TableCell>{data.username ?? "-"}</TableCell>
              <TableCell>{formatDate(data.startDate)}</TableCell>
              <TableCell className={cn("font-medium", isExpired ? "text-red-500" : "")}>
                {formatDate(data.expiryDate)}
                {isExpired && " (expired)"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <CredentialsDialog instanceId={data.id} />
                  {canShowRenew && (
                    <RenewButton instanceId={data.id} disabled={!canRenew} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  )
}
