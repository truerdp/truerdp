"use client"

import { useParams } from "next/navigation"

import { useInstance } from "@/hooks/use-instance"
import { useInstanceTransactions } from "@/hooks/use-instance-transactions"
import { InstanceDetailsTable } from "@/components/instance-details-page/details-table"
import { getInstanceBillingState } from "@/components/instance-details-page/helpers"
import { InstanceDetailsSkeleton } from "@/components/instance-details-page/skeleton"

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
    return <div>Failed to load instance</div>
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instance #{data.id}</h1>
        <p className="text-sm text-muted-foreground">
          Review your provisioned instance details.
        </p>
      </div>
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
