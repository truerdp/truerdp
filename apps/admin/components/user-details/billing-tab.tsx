import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Package02Icon,
  TaskDone02Icon,
} from "@hugeicons/core-free-icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { TabsContent } from "@workspace/ui/components/tabs"
import {
  MetaRow,
  SectionEmpty,
  formatDateOnly,
  getBillingAddress,
  getPreferredMethods,
} from "./helpers"
import { BillingInvoicesCard } from "./billing-invoices-card"
import { BillingTransactionsCard } from "./billing-transactions-card"
import type { UserDetailsData } from "./types"

export function BillingTab({
  data,
  successRate,
}: {
  data: UserDetailsData
  successRate: string
}) {
  return (
    <TabsContent value="billing" className="space-y-4">
      {data.summary.unpaidInvoices > 0 || data.summary.failedTransactions > 0 ? (
        <Alert>
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
          <AlertTitle>Billing follow-up recommended</AlertTitle>
          <AlertDescription>
            {data.summary.unpaidInvoices > 0
              ? `${data.summary.unpaidInvoices} unpaid invoice${
                  data.summary.unpaidInvoices === 1 ? "" : "s"
                } remain open. `
              : ""}
            {data.summary.failedTransactions > 0
              ? `${data.summary.failedTransactions} failed transaction${
                  data.summary.failedTransactions === 1 ? "" : "s"
                } should be reviewed for retry or outreach.`
              : ""}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <HugeiconsIcon icon={TaskDone02Icon} strokeWidth={2} className="size-4" />
          <AlertTitle>Billing looks healthy</AlertTitle>
          <AlertDescription>
            No unpaid invoices or failed payments are currently outstanding for
            this account.
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
            {data.latestBillingDetails ? (
              <div className="space-y-4">
                <MetaRow
                  label="Contact"
                  value={`${data.latestBillingDetails.firstName} ${data.latestBillingDetails.lastName}`}
                />
                <MetaRow label="Email" value={data.latestBillingDetails.email} />
                <MetaRow label="Phone" value={data.latestBillingDetails.phone} />
                <MetaRow
                  label="Company"
                  value={data.latestBillingDetails.companyName || "-"}
                />
                <MetaRow
                  label="Tax ID"
                  value={data.latestBillingDetails.taxId || "-"}
                />
                <MetaRow
                  label="Address"
                  value={getBillingAddress(data.latestBillingDetails)}
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
              value={`${data.summary.paidInvoices}/${data.summary.totalInvoices}`}
            />
            <MetaRow label="Transaction success rate" value={successRate} />
            <MetaRow
              label="Latest billing capture"
              value={formatDateOnly(data.latestBillingCapturedAt)}
            />
            <MetaRow
              label="Preferred methods seen"
              value={getPreferredMethods(data.transactions)}
            />
          </CardContent>
        </Card>
      </div>

      <BillingInvoicesCard data={data} />
      <BillingTransactionsCard data={data} />
    </TabsContent>
  )
}
