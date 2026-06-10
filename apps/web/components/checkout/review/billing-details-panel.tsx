import { Badge } from "@workspace/ui/components/badge"
import type { OrderBillingDetails } from "@/hooks/use-order"

interface BillingDetailsPanelProps {
  details: OrderBillingDetails | null
  isComplete: boolean
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
}: BillingDetailsPanelProps) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Billing information</p>
          <p className="text-xs text-muted-foreground">
            This address comes from your signup profile and is locked for this
            order.
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
          Complete your billing address in your account before continuing to
          payment.
        </p>
      )}
    </div>
  )
}
