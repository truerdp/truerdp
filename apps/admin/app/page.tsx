"use client"

import { ExpiredTable } from "@/components/admin-dashboard/expired-table"
import { ExpiringSoonTable } from "@/components/admin-dashboard/expiring-soon-table"
import { DashboardEmptyState, ErrorMessage } from "@/components/admin-dashboard/states"
import { TableSkeleton } from "@/components/admin-dashboard/table-skeleton"
import { useExpiredInstances } from "@/hooks/use-expired-instances"
import { useExpiringSoonInstances } from "@/hooks/use-expiring-soon-instances"

export default function Page() {
  const {
    data: expiringSoonData,
    isLoading: isExpiringSoonLoading,
    isError: isExpiringSoonError,
    error: expiringSoonError,
  } = useExpiringSoonInstances()
  const {
    data: expiredData,
    isLoading: isExpiredLoading,
    isError: isExpiredError,
    error: expiredError,
  } = useExpiredInstances()

  const expiringSoonInstances = expiringSoonData ?? []
  const expiredInstances = expiredData ?? []

  return (
    <section className="min-w-0 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track upcoming expirations and clean up expired instances.
        </p>
      </div>

      <section className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Expiring Soon</h2>
        {isExpiringSoonLoading ? (
          <div className="rounded-lg border">
            <TableSkeleton
              columns={["Instance ID", "Expiry Date", "Days Until Expiry"]}
            />
          </div>
        ) : isExpiringSoonError ? (
          <ErrorMessage
            message={
              expiringSoonError.message || "Failed to load expiring instances."
            }
          />
        ) : expiringSoonInstances.length === 0 ? (
          <div className="rounded-lg border">
            <DashboardEmptyState title="No instances expiring soon" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <ExpiringSoonTable instances={expiringSoonInstances} />
          </div>
        )}
      </section>

      <section className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Expired Instances</h2>
        {isExpiredLoading ? (
          <div className="rounded-lg border">
            <TableSkeleton
              columns={[
                "Instance ID",
                "Expiry Date",
                "Days Since Expiry",
                "Action",
              ]}
            />
          </div>
        ) : isExpiredError ? (
          <ErrorMessage
            message={expiredError.message || "Failed to load expired instances."}
          />
        ) : expiredInstances.length === 0 ? (
          <div className="rounded-lg border">
            <DashboardEmptyState title="No expired instances" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <ExpiredTable instances={expiredInstances} />
          </div>
        )}
      </section>
    </section>
  )
}
