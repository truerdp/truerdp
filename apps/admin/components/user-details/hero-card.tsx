import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon } from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  formatCurrency,
  formatDateOnly,
  formatStatusLabel,
  getInitials,
  getRoleVariant,
  MetricTile,
} from "./helpers"
import type { UserDetailsData } from "./types"

interface UserHeroCardProps {
  data: UserDetailsData
  displayName: string
  successRate: string
}

export function UserHeroCard({
  data,
  displayName,
  successRate,
}: UserHeroCardProps) {
  const { user, summary } = data

  return (
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
                <div className="text-sm text-muted-foreground">{user.email}</div>
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
  )
}
