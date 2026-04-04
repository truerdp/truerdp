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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import RenewButton from "@/components/renew-button"
import { cn } from "@workspace/ui/lib/utils"
import { formatAmount } from "../../transactions/page"

interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

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
    <Card className="max-w-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-40" />
      </CardFooter>
    </Card>
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
    <div className="flex flex-col gap-6">
      {hasPendingRenewal && (
        <Alert className="max-w-2xl border-yellow-300 bg-yellow-50 text-yellow-800">
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
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Instance #{data?.id}</CardTitle>
          <CardDescription>
            Review your provisioned instance details.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {data && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span>
                <Badge variant={getStatusVariant(data.status)}>
                  {formatStatus(data.status)}
                </Badge>
              </span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Billing Status
            </span>
            <span>
              <Badge variant={getBillingStatusVariant(billingStatus)}>
                {formatStatus(billingStatus)}
              </Badge>
            </span>
          </div>
          <Separator />
          <DetailItem label="IP Address" value={data?.ipAddress ?? "-"} />
          <Separator />
          <DetailItem label="Username" value={data?.username ?? "-"} />
          <Separator />
          <DetailItem
            label="Start Date"
            value={formatDate(data?.startDate ?? null)}
          />
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expiry Date</span>
            <span
              className={cn("font-medium", isExpired ? "text-red-500" : "")}
            >
              {formatDate(data.expiryDate)}
              {isExpired && " (expired)"}
            </span>
          </div>
        </CardContent>

        <CardFooter>
          {data && <CredentialsDialog instanceId={data.id} />}
          {canShowRenew && (
            <RenewButton instanceId={data.id} disabled={!canRenew} />
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
