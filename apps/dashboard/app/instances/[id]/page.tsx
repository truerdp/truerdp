"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { useInstance } from "@/hooks/use-instance"
import { useInstanceTransactions } from "@/hooks/use-instance-transactions"
import { InstanceDetailsTable } from "@/components/instance-details-page/details-table"
import { getInstanceBillingState } from "@/components/instance-details-page/helpers"
import { InstanceDetailsSkeleton } from "@/components/instance-details-page/skeleton"
import { dashboardPaths } from "@/lib/paths"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export default function InstanceDetails() {
  const { id } = useParams()
  const instanceId = String(id)

  const { data, isLoading, error } = useInstance(instanceId)
  const { data: transactions = [] } = useInstanceTransactions(instanceId)

  const {
    hasPendingRenewal,
    latestPendingTransaction,
    canShowRenew,
    canRenew,
    isExpired,
    billingStatus,
  } = getInstanceBillingState(data, transactions)

  if (isLoading) {
    return <InstanceDetailsSkeleton />
  }

  if (error || !data) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Instance not found</EmptyTitle>
          <EmptyDescription>
            This instance may belong to another account or no longer exist.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <Link
        href={dashboardPaths.instances}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        <HugeiconsIcon
          icon={ArrowLeft02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Back to instances
      </Link>
      <InstanceDetailsTable
        data={data}
        hasPendingRenewal={hasPendingRenewal}
        latestPendingTransaction={latestPendingTransaction}
        canShowRenew={canShowRenew}
        canRenew={canRenew}
        isExpired={isExpired}
        billingStatus={billingStatus}
      />
    </section>
  )
}
