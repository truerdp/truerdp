"use client"

import { useParams } from "next/navigation"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"
import CredentialsDialog from "@/components/credentials-dialog"
import { useInstance, type InstanceDetailsData } from "@/hooks/use-instance"
import { useInstanceTransactions } from "@/hooks/use-instance-transactions"
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
import { Skeleton } from "@workspace/ui/components/skeleton"
import RenewButton from "@/components/renew-button"
import { cn } from "@workspace/ui/lib/utils"
import { formatAmount } from "@/lib/format"

function formatDate(value: string | null): string {
  if (!value) return "-"
  return format(new Date(value), "MMM d, yyyy")
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

function getStatusVariant(
  status: InstanceDetailsData["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"

    case "suspended":
      return "destructive"

    case "pending":
    case "provisioning":
      return "outline"

    case "expired":
      return "secondary"

    case "termination_pending":
    case "terminated":
      return "destructive"

    default:
      return "secondary"
  }
}

type BillingStatus = "active" | "renewal_pending" | "expired"

function getBillingStatusVariant(
  status: BillingStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"

    case "renewal_pending":
      return "outline"

    case "expired":
      return "destructive"

    default:
      return "secondary"
  }
}

function InstanceDetailsSkeleton() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instance Details</h1>
        <p className="text-sm text-muted-foreground">
          Review your provisioned instance details.
        </p>
      </div>
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
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export default function InstanceDetails() {
  const { id } = useParams()
  const instanceId = String(id)

  const { data, isLoading, error } = useInstance(instanceId)
  const { data: transactions = [] } = useInstanceTransactions(instanceId)

  const hasPendingRenewal = transactions?.some((tx) => tx.status === "pending")

  const pendingTransactions = transactions?.filter(
    (tx) => tx.status === "pending"
  )

  const latestPendingTransaction = pendingTransactions?.[0]

  const canShowRenew = data?.status === "active" || data?.status === "expired"
  const canRenew = canShowRenew && !hasPendingRenewal
  const isExpired =
    data?.status === "expired" ||
    Boolean(data?.expiryDate && new Date(data.expiryDate) < new Date())

  const billingStatus: BillingStatus = hasPendingRenewal
    ? "renewal_pending"
    : isExpired
      ? "expired"
      : "active"

  if (isLoading) {
    return <InstanceDetailsSkeleton />
  }

  if (error || !data) {
    return <div>Failed to load instance</div>
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Instance #{data.id}
        </h1>
        <p className="text-sm text-muted-foreground">
          Review your provisioned instance details.
        </p>
      </div>

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
              {format(
                new Date(latestPendingTransaction.createdAt),
                "MMM d, yyyy p"
              )}
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
              <TableCell className="font-mono">
                {data.ipAddress ?? "-"}
              </TableCell>
              <TableCell>{data.username ?? "-"}</TableCell>
              <TableCell>{formatDate(data.startDate)}</TableCell>
              <TableCell
                className={cn("font-medium", isExpired ? "text-red-500" : "")}
              >
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
    </section>
  )
}
