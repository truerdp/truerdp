export type Coupon = {
  id: number
  code: string
  type: "percent" | "flat"
  value: number
  appliesTo: "all" | "new_purchase" | "renewal"
  maxUses: number | null
  expiresAt: string | null
  dodoSyncStatus: "pending" | "synced" | "failed"
  dodoSyncError: string | null
  isActive: boolean
  usageCount: number
}

export type CouponInput = {
  code: string
  type: "percent" | "flat"
  value: number
  appliesTo: "all" | "new_purchase" | "renewal"
  maxUses: number | null
  expiresAt: string | null
  isActive: boolean
}

export const emptyCouponForm: CouponInput = {
  code: "",
  type: "percent",
  value: 10,
  appliesTo: "all",
  maxUses: null,
  expiresAt: null,
  isActive: true,
}

export function formatCouponValue(coupon: Coupon) {
  return coupon.type === "percent"
    ? `${coupon.value}%`
    : `$${(coupon.value / 100).toFixed(2)}`
}

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export function getCouponExpiryState(expiresAt: string | null) {
  const expiryDate = expiresAt ? new Date(expiresAt) : null
  return {
    expiryDate,
    expiryTime: expiryDate ? formatTimeValue(expiryDate) : "",
  }
}

