"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ComputerTerminalIcon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Package02Icon,
  TaskDone02Icon,
} from "@hugeicons/core-free-icons"

import { adminPaths } from "@/lib/paths"
import {
  useUserDetails,
  type AdminUser360Details,
} from "@/hooks/use-user-details"
import { Badge } from "@workspace/ui/components/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toLocaleString()} ${currency.toUpperCase()}`
  }
}

function formatMethod(
  method: "upi" | "usdt_trc20" | "dodo_checkout" | null | undefined
) {
  if (!method) {
    return "-"
  }

  switch (method) {
    case "upi":
      return "UPI"
    case "usdt_trc20":
      return "USDT (TRC20)"
    case "dodo_checkout":
      return "Dodo Checkout"
    default:
      return String(method).replaceAll("_", " ")
  }
}

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ")
}

function getDisplayName(user: AdminUser360Details["user"]) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()

  if (fullName) {
    return fullName
  }

  return user.email
}

function getInitials(user: AdminUser360Details["user"]) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.trim()

  if (initials) {
    return initials.toUpperCase()
  }

  return user.email.slice(0, 2).toUpperCase()
}

function getRoleVariant(role: AdminUser360Details["user"]["role"]) {
  switch (role) {
    case "admin":
      return "default"
    case "operator":
      return "outline"
    default:
      return "secondary"
  }
}

function getInstanceStatusVariant(
  status: AdminUser360Details["instances"][number]["status"]
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
    case "failed":
      return "destructive"
    default:
      return "secondary"
  }
}

function getInvoiceStatusVariant(
  status: AdminUser360Details["invoices"][number]["status"]
): "default" | "secondary" | "outline" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

function getTransactionStatusVariant(
  status: AdminUser360Details["transactions"][number]["status"]
): "default" | "secondary" | "destructive" {
  if (status === "confirmed") {
    return "default"
  }

  if (status === "pending") {
    return "secondary"
  }

  return "destructive"
}

function getSuccessRate(
  confirmedTransactions: number,
  totalTransactions: number
) {
  if (totalTransactions === 0) {
    return "0%"
  }

  return `${Math.round((confirmedTransactions / totalTransactions) * 100)}%`
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-3xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-80 rounded-full" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-4xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-4xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionEmpty({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/85 p-4 shadow-sm backdrop-blur">
      <div className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  )
}

function InsightRow({
  title,
  description,
  tone = "neutral",
}: {
  title: string
  description: string
  tone?: InsightTone
}) {
  return (
    <div className="flex gap-3 rounded-3xl border border-border/60 bg-muted/30 p-4">
      <span
        className={cn(
          "mt-1 size-2.5 shrink-0 rounded-full",
          tone === "good" && "bg-primary",
          tone === "warning" && "bg-amber-500",
          tone === "neutral" && "bg-muted-foreground/50"
        )}
      />
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}

type InsightTone = "neutral" | "good" | "warning"

interface Insight {
  title: string
  description: string
  tone: InsightTone
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="w-full text-sm font-medium break-words sm:w-auto sm:text-right">
        {value}
      </span>
    </div>
  )
}

function CompactField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn("text-sm font-medium break-words", className)}>
        {value}
      </div>
    </div>
  )
}

interface UserDetailsProps {
  userId: number
}

export function UserDetails({ userId }: UserDetailsProps) {
  const { data, isLoading, error } = useUserDetails(userId)

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
        <AlertTitle>Unable to load User 360</AlertTitle>
        <AlertDescription>
          {error?.message || "The requested user could not be loaded."}
        </AlertDescription>
      </Alert>
    )
  }

  const { user, summary, latestBillingDetails, latestBillingCapturedAt } = data
  const displayName = getDisplayName(user)
  const successRate = getSuccessRate(
    summary.confirmedTransactions,
    summary.totalTransactions
  )
  const activeInstances = data.instances.filter(
    (instance) => instance.status === "active"
  )
  const recentTransactions = data.transactions.slice(0, 5)
  const recentInvoices = data.invoices.slice(0, 6)
  const recentInstances = data.instances.slice(0, 6)
  const billingIdentity = latestBillingDetails?.companyName
    ? latestBillingDetails.companyName
    : latestBillingDetails
      ? `${latestBillingDetails.firstName} ${latestBillingDetails.lastName}`.trim()
      : null

  const insights: Insight[] = [
    summary.activeInstances > 0
      ? {
          title: `${summary.activeInstances} active service${
            summary.activeInstances === 1 ? "" : "s"
          } in play`,
          description:
            summary.expiringSoonInstances > 0
              ? `${summary.expiringSoonInstances} service${
                  summary.expiringSoonInstances === 1 ? "" : "s"
                } expire within the next 72 hours.`
              : "No immediate infrastructure expirations detected.",
          tone: summary.expiringSoonInstances > 0 ? "warning" : "good",
        }
      : {
          title: "No active services right now",
          description:
            "This user has no currently active infrastructure assigned.",
          tone: "neutral",
        },
    summary.unpaidInvoices > 0
      ? {
          title: `${summary.unpaidInvoices} unpaid invoice${
            summary.unpaidInvoices === 1 ? "" : "s"
          } awaiting follow-up`,
          description: `Outstanding balance: ${formatCurrency(
            summary.outstandingCents,
            summary.currency
          )}.`,
          tone: "warning",
        }
      : {
          title: "Billing is currently settled",
          description: "No unpaid invoices are sitting open at the moment.",
          tone: "good",
        },
    summary.failedTransactions > 0
      ? {
          title: `${summary.failedTransactions} failed payment attempt${
            summary.failedTransactions === 1 ? "" : "s"
          } recorded`,
          description:
            "Review transaction references and failure reasons before outreach.",
          tone: "warning",
        }
      : {
          title: "Payment rail looks healthy",
          description: "No failed transaction history has been recorded.",
          tone: "good",
        },
    latestBillingDetails
      ? {
          title: "Billing profile captured",
          description: `${billingIdentity} was last recorded on ${formatDateOnly(
            latestBillingCapturedAt
          )}.`,
          tone: "neutral",
        }
      : {
          title: "No billing profile on file",
          description:
            "The user has not yet stored a billing identity or address snapshot.",
          tone: "neutral",
        },
  ]

  return (
    <section className="space-y-6">
      <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-primary/10 via-card to-amber-500/10 shadow-lg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_32%)]" />
        <CardContent className="relative grid gap-8 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              <HugeiconsIcon
                icon={DashboardSquare01Icon}
                strokeWidth={2}
                className="size-4"
              />
              User 360
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar size="lg" className="size-16 border border-border/60">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-3xl font-semibold tracking-tight">
                    {displayName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getRoleVariant(user.role)}>
                    {formatStatusLabel(user.role)}
                  </Badge>
                  <Badge variant="outline">User #{user.id}</Badge>
                  <Badge variant="outline">
                    Member since {formatDateOnly(user.createdAt)}
                  </Badge>
                </div>

                <p className="max-w-2xl text-sm text-muted-foreground">
                  Full-funnel view of account health, billing behavior, and
                  infrastructure history for fast operator decisions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile
              label="Lifetime Value"
              value={formatCurrency(summary.totalSpentCents, summary.currency)}
              helper={`${summary.paidInvoices} paid invoice${
                summary.paidInvoices === 1 ? "" : "s"
              }`}
            />
            <MetricTile
              label="Active Services"
              value={`${summary.activeInstances}`}
              helper={
                summary.expiringSoonInstances > 0
                  ? `${summary.expiringSoonInstances} expiring soon`
                  : "No urgent expiry flags"
              }
            />
            <MetricTile
              label="Open Balance"
              value={formatCurrency(summary.outstandingCents, summary.currency)}
              helper={`${summary.unpaidInvoices} unpaid invoice${
                summary.unpaidInvoices === 1 ? "" : "s"
              }`}
            />
            <MetricTile
              label="Last Activity"
              value={formatDateOnly(summary.lastActivityAt)}
              helper={
                summary.totalTransactions > 0
                  ? `${successRate} transaction success rate`
                  : "No payment activity yet"
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <Tabs defaultValue="overview">
          <TabsList
            variant="line"
            className="w-full justify-start overflow-x-auto pb-1"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          </TabsList>

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
                      summary.totalSpentCents,
                      summary.currency
                    )}
                  />
                  <MetaRow
                    label="Outstanding balance"
                    value={formatCurrency(
                      summary.outstandingCents,
                      summary.currency
                    )}
                  />
                  <MetaRow
                    label="Order mix"
                    value={`${summary.newPurchases} new / ${summary.renewals} renewal`}
                  />
                  <MetaRow
                    label="Transaction health"
                    value={`${summary.confirmedTransactions}/${summary.totalTransactions} confirmed`}
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
                    value={`${summary.activeInstances}`}
                  />
                  <MetaRow
                    label="Provisioning queue"
                    value={`${summary.pendingInstances}`}
                  />
                  <MetaRow
                    label="Expired / terminated"
                    value={`${summary.expiredInstances} / ${summary.terminatedInstances}`}
                  />
                  <MetaRow
                    label="Extension actions"
                    value={`${summary.totalExtensions}`}
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
                              <Badge
                                variant={getInstanceStatusVariant(
                                  instance.status
                                )}
                              >
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

          <TabsContent value="billing" className="space-y-4">
            {summary.unpaidInvoices > 0 || summary.failedTransactions > 0 ? (
              <Alert>
                <HugeiconsIcon
                  icon={Alert02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <AlertTitle>Billing follow-up recommended</AlertTitle>
                <AlertDescription>
                  {summary.unpaidInvoices > 0
                    ? `${summary.unpaidInvoices} unpaid invoice${
                        summary.unpaidInvoices === 1 ? "" : "s"
                      } remain open. `
                    : ""}
                  {summary.failedTransactions > 0
                    ? `${summary.failedTransactions} failed transaction${
                        summary.failedTransactions === 1 ? "" : "s"
                      } should be reviewed for retry or outreach.`
                    : ""}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <HugeiconsIcon
                  icon={TaskDone02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <AlertTitle>Billing looks healthy</AlertTitle>
                <AlertDescription>
                  No unpaid invoices or failed payments are currently
                  outstanding for this account.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Identity</CardTitle>
                  <CardDescription>
                    Latest stored billing snapshot from checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {latestBillingDetails ? (
                    <div className="space-y-4">
                      <MetaRow
                        label="Contact"
                        value={`${latestBillingDetails.firstName} ${latestBillingDetails.lastName}`}
                      />
                      <MetaRow
                        label="Email"
                        value={latestBillingDetails.email}
                      />
                      <MetaRow
                        label="Phone"
                        value={latestBillingDetails.phone}
                      />
                      <MetaRow
                        label="Company"
                        value={latestBillingDetails.companyName || "-"}
                      />
                      <MetaRow
                        label="Tax ID"
                        value={latestBillingDetails.taxId || "-"}
                      />
                      <MetaRow
                        label="Address"
                        value={[
                          latestBillingDetails.addressLine1,
                          latestBillingDetails.addressLine2,
                          latestBillingDetails.city,
                          latestBillingDetails.state,
                          latestBillingDetails.postalCode,
                          latestBillingDetails.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      />
                    </div>
                  ) : (
                    <SectionEmpty
                      title="No billing profile yet"
                      description="The user has not completed billing details on an order yet."
                      icon={Package02Icon}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Health</CardTitle>
                  <CardDescription>
                    Quick read on collection and checkout reliability.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MetaRow
                    label="Paid invoices"
                    value={`${summary.paidInvoices}/${summary.totalInvoices}`}
                  />
                  <MetaRow
                    label="Transaction success rate"
                    value={successRate}
                  />
                  <MetaRow
                    label="Latest billing capture"
                    value={formatDateOnly(latestBillingCapturedAt)}
                  />
                  <MetaRow
                    label="Preferred methods seen"
                    value={
                      Array.from(
                        new Set(
                          data.transactions.map((transaction) =>
                            formatMethod(transaction.method)
                          )
                        )
                      ).join(", ") || "-"
                    }
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Invoice ledger with latest transaction attachment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentInvoices.length === 0 ? (
                  <SectionEmpty
                    title="No invoices yet"
                    description="Invoices will appear here once the user starts checkout."
                    icon={CreditCardIcon}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-3 md:hidden">
                      {data.invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="rounded-3xl border border-border/60 bg-muted/20 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {invoice.invoiceNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Order #{invoice.order.id}
                              </div>
                            </div>
                            <Badge
                              variant={getInvoiceStatusVariant(invoice.status)}
                            >
                              {formatStatusLabel(invoice.status)}
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <CompactField
                              label="Plan"
                              value={`${invoice.plan.name} • ${invoice.plan.durationDays} days`}
                            />
                            <CompactField
                              label="Amount"
                              value={formatCurrency(
                                invoice.totalAmount,
                                invoice.currency
                              )}
                            />
                            <CompactField
                              label="Transaction"
                              value={invoice.transaction.reference || "-"}
                            />
                            <CompactField
                              label="Created"
                              value={formatDateTime(invoice.createdAt)}
                              className="text-muted-foreground"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Transaction</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {invoice.invoiceNumber}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Order #{invoice.order.id}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium">
                                    {invoice.plan.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {invoice.plan.durationDays} days •{" "}
                                    {formatStatusLabel(invoice.plan.kind)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatCurrency(
                                  invoice.totalAmount,
                                  invoice.currency
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getInvoiceStatusVariant(
                                    invoice.status
                                  )}
                                >
                                  {formatStatusLabel(invoice.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {invoice.transaction.reference || "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateTime(invoice.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  Payment attempts, outcomes, and linked infrastructure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.transactions.length === 0 ? (
                  <SectionEmpty
                    title="No transactions yet"
                    description="Payments and retries will populate this section automatically."
                    icon={CreditCardIcon}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-3 md:hidden">
                      {data.transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="rounded-3xl border border-border/60 bg-muted/20 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-medium">
                                {transaction.reference || `txn_${transaction.id}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Invoice {transaction.invoice.invoiceNumber}
                              </div>
                            </div>
                            <Badge
                              variant={getTransactionStatusVariant(
                                transaction.status
                              )}
                            >
                              {formatStatusLabel(transaction.status)}
                            </Badge>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <CompactField
                              label="Plan"
                              value={transaction.plan.name}
                            />
                            <CompactField
                              label="Amount"
                              value={formatCurrency(
                                transaction.amount,
                                transaction.invoice.currency
                              )}
                            />
                            <CompactField
                              label="Method"
                              value={formatMethod(transaction.method)}
                            />
                            <CompactField
                              label="Linked Instance"
                              value={
                                transaction.instance
                                  ? `#${transaction.instance.id} • ${
                                      transaction.instance.ipAddress || "No IP"
                                    }`
                                  : "-"
                              }
                            />
                            <CompactField
                              label="Created"
                              value={formatDateTime(transaction.createdAt)}
                              className="text-muted-foreground"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Linked Instance</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono text-sm">
                                    {transaction.reference || `txn_${transaction.id}`}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Invoice {transaction.invoice.invoiceNumber}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {transaction.plan.name}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatCurrency(
                                  transaction.amount,
                                  transaction.invoice.currency
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatMethod(transaction.method)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getTransactionStatusVariant(
                                    transaction.status
                                  )}
                                >
                                  {formatStatusLabel(transaction.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.instance ? (
                                  <Link
                                    href={adminPaths.instanceDetails(
                                      transaction.instance.id
                                    )}
                                    className="text-sm font-medium transition-colors hover:text-primary"
                                  >
                                    #{transaction.instance.id} •{" "}
                                    {transaction.instance.ipAddress || "No IP"}
                                  </Link>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateTime(transaction.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            {summary.expiringSoonInstances > 0 ? (
              <Alert>
                <HugeiconsIcon
                  icon={Alert02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <AlertTitle>Infrastructure follow-up needed</AlertTitle>
                <AlertDescription>
                  {summary.expiringSoonInstances} instance
                  {summary.expiringSoonInstances === 1 ? "" : "s"} expire
                  within the next 72 hours.
                </AlertDescription>
              </Alert>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Instance Portfolio</CardTitle>
                <CardDescription>
                  Provisioning history, lifecycle state, and extension signal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.instances.length === 0 ? (
                  <SectionEmpty
                    title="No infrastructure history yet"
                    description="Confirmed purchases will create instance records here."
                    icon={ComputerTerminalIcon}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-3 md:hidden">
                      {data.instances.map((instance) => (
                        <div
                          key={instance.id}
                          className="rounded-3xl border border-border/60 bg-muted/20 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <Link
                                href={adminPaths.instanceDetails(instance.id)}
                                className="font-medium transition-colors hover:text-primary"
                              >
                                Instance #{instance.id}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                Order #{instance.originOrderId}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={getInstanceStatusVariant(
                                  instance.status
                                )}
                              >
                                {formatStatusLabel(instance.status)}
                              </Badge>
                              {instance.isExpiringSoon ? (
                                <Badge variant="secondary">Expiring soon</Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <CompactField
                              label="Plan"
                              value={
                                instance.plan
                                  ? `${instance.plan.name} • ${instance.plan.cpu} CPU • ${instance.plan.ram} GB RAM • ${instance.plan.storage} GB`
                                  : "Plan unavailable"
                              }
                            />
                            <CompactField
                              label="Server"
                              value={`${instance.server?.ipAddress || "-"} • ${
                                instance.server?.provider || "Unassigned"
                              }${
                                instance.resource?.username
                                  ? ` • ${instance.resource.username}`
                                  : ""
                              }`}
                            />
                            <CompactField
                              label="Expiry"
                              value={`${formatDateOnly(instance.expiryDate)}${
                                instance.daysUntilExpiry != null &&
                                instance.daysUntilExpiry >= 0
                                  ? ` • ${instance.daysUntilExpiry} day${
                                      instance.daysUntilExpiry === 1 ? "" : "s"
                                    } remaining`
                                  : instance.daysSinceExpiry != null &&
                                      instance.daysSinceExpiry > 0
                                    ? ` • ${instance.daysSinceExpiry} day${
                                        instance.daysSinceExpiry === 1
                                          ? ""
                                          : "s"
                                      } overdue`
                                    : ""
                              }`}
                            />
                            <CompactField
                              label="Extensions"
                              value={
                                instance.extensionCount > 0
                                  ? `${instance.extensionCount} total${
                                      instance.lastExtensionDays
                                        ? ` • last +${instance.lastExtensionDays}d`
                                        : ""
                                    }`
                                  : "None"
                              }
                              className="text-muted-foreground"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Instance</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Server</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead>Extensions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.instances.map((instance) => (
                            <TableRow key={instance.id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Link
                                    href={adminPaths.instanceDetails(instance.id)}
                                    className="font-medium transition-colors hover:text-primary"
                                  >
                                    Instance #{instance.id}
                                  </Link>
                                  <span className="text-xs text-muted-foreground">
                                    Order #{instance.originOrderId}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant={getInstanceStatusVariant(
                                      instance.status
                                    )}
                                  >
                                    {formatStatusLabel(instance.status)}
                                  </Badge>
                                  {instance.isExpiringSoon ? (
                                    <Badge variant="secondary">
                                      Expiring soon
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium">
                                    {instance.plan?.name || "Plan unavailable"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {instance.plan
                                      ? `${instance.plan.cpu} CPU • ${instance.plan.ram} GB RAM • ${instance.plan.storage} GB`
                                      : "-"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm">
                                    {instance.server?.ipAddress || "-"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {instance.server?.provider || "Unassigned"}
                                    {instance.resource?.username
                                      ? ` • ${instance.resource.username}`
                                      : ""}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm">
                                    {formatDateOnly(instance.expiryDate)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {instance.daysUntilExpiry != null &&
                                    instance.daysUntilExpiry >= 0
                                      ? `${instance.daysUntilExpiry} day${
                                          instance.daysUntilExpiry === 1
                                            ? ""
                                            : "s"
                                        } remaining`
                                      : instance.daysSinceExpiry != null &&
                                          instance.daysSinceExpiry > 0
                                        ? `${instance.daysSinceExpiry} day${
                                            instance.daysSinceExpiry === 1
                                              ? ""
                                              : "s"
                                          } overdue`
                                        : "-"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {instance.extensionCount > 0
                                  ? `${instance.extensionCount} total${
                                      instance.lastExtensionDays
                                        ? ` • last +${instance.lastExtensionDays}d`
                                        : ""
                                    }`
                                  : "None"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Signals</CardTitle>
              <CardDescription>
                Operator-ready observations pulled from the account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight) => (
                <InsightRow
                  key={insight.title}
                  title={insight.title}
                  description={insight.description}
                  tone={insight.tone}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Metadata</CardTitle>
              <CardDescription>
                Core identity and timing markers for the account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetaRow label="User ID" value={`#${user.id}`} />
              <MetaRow label="Role" value={formatStatusLabel(user.role)} />
              <MetaRow label="Member since" value={formatDateOnly(user.createdAt)} />
              <MetaRow
                label="Profile updated"
                value={formatDateTime(user.updatedAt)}
              />
              <MetaRow
                label="Last activity"
                value={formatDateTime(summary.lastActivityAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Service List</CardTitle>
              <CardDescription>
                Fast jump points into currently live infrastructure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeInstances.length === 0 ? (
                <SectionEmpty
                  title="Nothing live right now"
                  description="Active services will surface here once provisioning completes."
                  icon={ComputerTerminalIcon}
                />
              ) : (
                activeInstances.slice(0, 5).map((instance) => (
                  <Link
                    key={instance.id}
                    href={adminPaths.instanceDetails(instance.id)}
                    className="block rounded-3xl border border-border/60 bg-muted/25 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Instance #{instance.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {instance.plan?.name || "Plan unavailable"} •{" "}
                          {instance.server?.ipAddress || "No IP yet"}
                        </div>
                      </div>
                      <Badge variant="default">Live</Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
