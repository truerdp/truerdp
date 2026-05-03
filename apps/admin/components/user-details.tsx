"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import { useUserDetails } from "@/hooks/use-user-details"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { UserHeroCard } from "./user-details/hero-card"
import {
  PageSkeleton,
  formatCurrency,
  formatDateOnly,
  getDisplayName,
  getSuccessRate,
} from "./user-details/helpers"
import { UserDetailsSidebar } from "./user-details/sidebar-panels"
import { UserDetailsTabs } from "./user-details/tabs"
import type { Insight } from "./user-details/types"

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

  const displayName = getDisplayName(data.user)
  const successRate = getSuccessRate(
    data.summary.confirmedTransactions,
    data.summary.totalTransactions
  )
  const billingIdentity = data.latestBillingDetails?.companyName
    ? data.latestBillingDetails.companyName
    : data.latestBillingDetails
      ? `${data.latestBillingDetails.firstName} ${data.latestBillingDetails.lastName}`.trim()
      : null

  const insights: Insight[] = [
    data.summary.activeInstances > 0
      ? {
          title: `${data.summary.activeInstances} active service${
            data.summary.activeInstances === 1 ? "" : "s"
          } in play`,
          description:
            data.summary.expiringSoonInstances > 0
              ? `${data.summary.expiringSoonInstances} service${
                  data.summary.expiringSoonInstances === 1 ? "" : "s"
                } expire within the next 72 hours.`
              : "No immediate infrastructure expirations detected.",
          tone: data.summary.expiringSoonInstances > 0 ? "warning" : "good",
        }
      : {
          title: "No active services right now",
          description:
            "This user has no currently active infrastructure assigned.",
          tone: "neutral",
        },
    data.summary.unpaidInvoices > 0
      ? {
          title: `${data.summary.unpaidInvoices} unpaid invoice${
            data.summary.unpaidInvoices === 1 ? "" : "s"
          } awaiting follow-up`,
          description: `Outstanding balance: ${formatCurrency(
            data.summary.outstandingCents,
            data.summary.currency
          )}.`,
          tone: "warning",
        }
      : {
          title: "Billing is currently settled",
          description: "No unpaid invoices are sitting open at the moment.",
          tone: "good",
        },
    data.summary.failedTransactions > 0
      ? {
          title: `${data.summary.failedTransactions} failed payment attempt${
            data.summary.failedTransactions === 1 ? "" : "s"
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
    data.latestBillingDetails
      ? {
          title: "Billing profile captured",
          description: `${billingIdentity} was last recorded on ${formatDateOnly(
            data.latestBillingCapturedAt
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
      <UserHeroCard data={data} displayName={displayName} successRate={successRate} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <UserDetailsTabs data={data} successRate={successRate} />
        <UserDetailsSidebar data={data} insights={insights} />
      </div>
    </section>
  )
}
