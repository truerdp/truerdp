import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"

import { formatAmount } from "@/lib/format"
import type { BillingOrder } from "@/hooks/use-order"

interface OrderPricingPanelProps {
  order: BillingOrder
  couponCode: string
  setCouponCode: (value: string) => void
  existingPendingTransaction: boolean
  isUpdatingCoupon: boolean
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}</span>
      </div>
      <Separator className="my-3" />
    </>
  )
}

export function OrderPricingPanel({
  order,
  couponCode,
  setCouponCode,
  existingPendingTransaction,
  isUpdatingCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: OrderPricingPanelProps) {
  const hasAppliedCoupon = order.invoice?.couponId != null

  return (
    <div className="rounded-xl border p-4">
      <div className="space-y-3">
        <p className="text-sm font-medium">Items</p>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.planName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.durationDays} days x {item.quantity}
                </p>
              </div>
              <span>{formatAmount(item.lineTotalUsdCents)}</span>
            </div>
          </div>
        ))}
      </div>
      <Separator className="my-3" />
      <SummaryRow
        label="Subtotal"
        value={formatAmount(
          order.invoice?.subtotal ?? order.pricing.priceUsdCents
        )}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="coupon-code"
              className="text-sm text-muted-foreground"
            >
              Coupon
            </label>
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(event) =>
                setCouponCode(event.target.value.toUpperCase())
              }
              disabled={isUpdatingCoupon || existingPendingTransaction}
              placeholder="WELCOME10"
            />
          </div>
          <Button
            variant="outline"
            onClick={onApplyCoupon}
            disabled={
              isUpdatingCoupon ||
              existingPendingTransaction ||
              couponCode.trim().length === 0
            }
          >
            Apply
          </Button>
          {hasAppliedCoupon ? (
            <Button
              variant="ghost"
              onClick={onRemoveCoupon}
              disabled={isUpdatingCoupon || existingPendingTransaction}
            >
              Remove
            </Button>
          ) : null}
        </div>
        {existingPendingTransaction ? (
          <p className="text-xs text-muted-foreground">
            Coupon changes are locked after payment starts.
          </p>
        ) : null}
      </div>

      <Separator className="my-3" />
      {order?.invoice?.discount && order.invoice?.discount > 0 ? (
        <SummaryRow
          label="Discount"
          value={`-${formatAmount(order.invoice?.discount ?? 0)}`}
        />
      ) : null}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="text-lg font-semibold">
          {formatAmount(
            order.invoice?.totalAmount ?? order.pricing.priceUsdCents
          )}
        </span>
      </div>
    </div>
  )
}
