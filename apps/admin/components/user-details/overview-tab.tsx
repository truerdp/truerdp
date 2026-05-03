import Link from "next/link"
import { CreditCardIcon, ComputerTerminalIcon } from "@hugeicons/core-free-icons"
import { adminPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  TabsContent,
} from "@workspace/ui/components/tabs"
import {
  MetaRow,
  SectionEmpty,
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatMethod,
  formatStatusLabel,
  getInstanceStatusVariant,
  getTransactionStatusVariant,
} from "./helpers"
import type { UserDetailsData } from "./types"
export function OverviewTab({ data }: { data: UserDetailsData }) {
  const recentTransactions = data.transactions.slice(0, 5)
  const recentInstances = data.instances.slice(0, 6)

  return (
    <TabsContent value="overview" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commercial Snapshot</CardTitle>
            <CardDescription>
              Revenue posture and order behavior across the account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetaRow
              label="Lifetime revenue"
              value={formatCurrency(
                data.summary.totalSpentCents,
                data.summary.currency
              )}
            />
            <MetaRow
              label="Outstanding balance"
              value={formatCurrency(
                data.summary.outstandingCents,
                data.summary.currency
              )}
            />
            <MetaRow
              label="Order mix"
              value={`${data.summary.newPurchases} new / ${data.summary.renewals} renewal`}
            />
            <MetaRow
              label="Transaction health"
              value={`${data.summary.confirmedTransactions}/${data.summary.totalTransactions} confirmed`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Snapshot</CardTitle>
            <CardDescription>
              Current service posture and operational follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetaRow
              label="Active instances"
              value={`${data.summary.activeInstances}`}
            />
            <MetaRow
              label="Provisioning queue"
              value={`${data.summary.pendingInstances}`}
            />
            <MetaRow
              label="Expired / terminated"
              value={`${data.summary.expiredInstances} / ${data.summary.terminatedInstances}`}
            />
            <MetaRow
              label="Extension actions"
              value={`${data.summary.totalExtensions}`}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Latest payment actions with method and outcome.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <SectionEmpty
                title="No transactions yet"
                description="Payment attempts will appear here once checkout activity starts."
                icon={CreditCardIcon}
              />
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-3xl border border-border/60 bg-muted/25 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(
                            transaction.amount,
                            transaction.invoice.currency
                          )}
                        </span>
                        <Badge
                          variant={getTransactionStatusVariant(
                            transaction.status
                          )}
                        >
                          {formatStatusLabel(transaction.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.plan.name} •{" "}
                        {formatMethod(transaction.method)} • Ref{" "}
                        {transaction.reference || "pending"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(
                        transaction.confirmedAt || transaction.createdAt
                      )}
                    </div>
                  </div>
                  {transaction.failureReason ? (
                    <div className="mt-2 text-sm text-destructive">
                      {transaction.failureReason}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Services</CardTitle>
            <CardDescription>
              Active and recent infrastructure tied to the account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInstances.length === 0 ? (
              <SectionEmpty
                title="No instances provisioned"
                description="Instance records will appear after a confirmed purchase is fulfilled."
                icon={ComputerTerminalIcon}
              />
            ) : (
              recentInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="rounded-3xl border border-border/60 bg-muted/25 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={adminPaths.instanceDetails(instance.id)}
                          className="font-medium transition-colors hover:text-primary"
                        >
                          Instance #{instance.id}
                        </Link>
                        <Badge variant={getInstanceStatusVariant(instance.status)}>
                          {formatStatusLabel(instance.status)}
                        </Badge>
                        {instance.isExpiringSoon ? (
                          <Badge variant="secondary">Expiring soon</Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {instance.plan?.name || "Plan unavailable"} •{" "}
                        {instance.server?.ipAddress || "No IP assigned"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateOnly(instance.expiryDate)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  )
}
