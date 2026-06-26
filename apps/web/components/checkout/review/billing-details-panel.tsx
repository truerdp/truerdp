import { Badge } from "@workspace/ui/components/badge"
import type { OrderBillingDetails } from "@/hooks/use-order"
import { HugeiconsIcon } from "@hugeicons/react"
import { LinkCircle02Icon } from "@hugeicons/core-free-icons"

interface BillingDetailsPanelProps {
  details: OrderBillingDetails | null
  isComplete: boolean
  orderId: number
}

function BillingRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value || "-"}</dd>
    </div>
  )
}

export function BillingDetailsPanel({
  details,
  isComplete,
  orderId,
}: BillingDetailsPanelProps) {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"
  const supportPrefill = buildBillingSupportPrefill(
    dashboardUrl,
    orderId,
    details
  )
  const supportFormId = `billing-support-prefill-${orderId}`

  return (
    <div className="rounded-xl border p-4">
      <form
        id={supportFormId}
        action={supportPrefill.action}
        method="post"
        target="_blank"
        className="hidden"
      >
        <input type="hidden" name="subject" value={supportPrefill.subject} />
        <input type="hidden" name="message" value={supportPrefill.message} />
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Billing information</p>
          <p className="text-xs text-muted-foreground">
            This address comes from your signup profile and is locked for this
            order.{" "}
            <button
              type="submit"
              form={supportFormId}
              className="inline-flex text-primary underline-offset-4 hover:underline"
            >
              Request an admin update{" "}
              <HugeiconsIcon
                className="mx-0.5"
                size="16"
                icon={LinkCircle02Icon}
              />
            </button>
          </p>
        </div>
        <Badge variant={isComplete ? "secondary" : "outline"}>
          {isComplete ? "Saved" : "Missing"}
        </Badge>
      </div>

      {details ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          <BillingRow
            label="Name"
            value={`${details.firstName} ${details.lastName}`.trim()}
          />
          <BillingRow label="Billing email" value={details.email} />
          <BillingRow label="Phone" value={details.phone} />
          <BillingRow label="Company" value={details.companyName} />
          <BillingRow label="GST/VAT ID" value={details.taxId} />
          <BillingRow label="Address line 1" value={details.addressLine1} />
          <BillingRow label="Address line 2" value={details.addressLine2} />
          <BillingRow label="City" value={details.city} />
          <BillingRow label="State/Region" value={details.state} />
          <BillingRow label="Postal code" value={details.postalCode} />
          <BillingRow label="Country" value={details.country} />
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Billing details are missing.{" "}
          <button
            type="submit"
            form={supportFormId}
            className="inline-flex text-primary underline-offset-4 hover:underline"
          >
            Contact support{" "}
            <HugeiconsIcon
              className="mx-0.5"
              size="16"
              icon={LinkCircle02Icon}
            />
          </button>{" "}
          if this needs to be updated.
        </p>
      )}
    </div>
  )
}

function buildBillingSupportPrefill(
  dashboardUrl: string,
  orderId: number,
  details: OrderBillingDetails | null
) {
  const message = details
    ? [
        "I need help updating locked billing details for checkout.",
        "",
        `Order ID: ${orderId}`,
        "",
        "Current billing details:",
        `Name: ${`${details.firstName} ${details.lastName}`.trim() || "-"}`,
        `Billing email: ${details.email || "-"}`,
        `Phone: ${details.phone || "-"}`,
        `Company: ${details.companyName || "-"}`,
        `GST/VAT ID: ${details.taxId || "-"}`,
        `Address line 1: ${details.addressLine1 || "-"}`,
        `Address line 2: ${details.addressLine2 || "-"}`,
        `City: ${details.city || "-"}`,
        `State/Region: ${details.state || "-"}`,
        `Postal code: ${details.postalCode || "-"}`,
        `Country: ${details.country || "-"}`,
        "",
        "Requested billing change:",
        "",
      ]
    : [
        "I need help adding billing details for checkout.",
        "",
        `Order ID: ${orderId}`,
        "",
        "Billing details are missing on my account, so checkout is blocked.",
        "",
        "Requested billing details:",
        "Name:",
        "Billing email:",
        "Phone:",
        "Company:",
        "GST/VAT ID:",
        "Address line 1:",
        "Address line 2:",
        "City:",
        "State/Region:",
        "Postal code:",
        "Country:",
        "",
      ]

  return {
    action: `${dashboardUrl}/support/prefill`,
    subject: details
      ? `Locked billing change for order #${orderId}`
      : `Missing billing details for order #${orderId}`,
    message: message.join("\n"),
  }
}
