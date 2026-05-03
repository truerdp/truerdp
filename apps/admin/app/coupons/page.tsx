"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { CouponFormCard } from "@/app/coupons/_components/coupon-form-card"
import { CouponsTable } from "@/app/coupons/_components/coupons-table"
import {
  emptyCouponForm,
  getCouponExpiryState,
  type Coupon,
  type CouponInput,
} from "@/app/coupons/models"
import { queryKeys } from "@/lib/query-keys"

export default function CouponsPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CouponInput>(emptyCouponForm)
  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: queryKeys.coupons(),
    queryFn: () => clientApi("/admin/coupons"),
  })

  const saveCoupon = useMutation({
    mutationFn: (input: CouponInput & { id?: number }) =>
      clientApi(input.id ? `/admin/coupons/${input.id}` : "/admin/coupons", {
        method: input.id ? "PUT" : "POST",
        body: input,
      }),
    onSuccess: async () => {
      toast.success(editingId ? "Coupon updated" : "Coupon created")
      setEditingId(null)
      setForm(emptyCouponForm)
      await queryClient.invalidateQueries({ queryKey: queryKeys.coupons() })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to save coupon")
    },
  })

  const toggleCoupon = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      clientApi(`/admin/coupons/${id}/status`, {
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.coupons() })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update coupon")
    },
  })

  const { expiryDate, expiryTime } = getCouponExpiryState(form.expiresAt)

  function editCoupon(coupon: Coupon) {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      appliesTo: coupon.appliesTo,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
    })
  }

  function setExpiryDatePart(nextDate: Date | undefined) {
    if (!nextDate) {
      setForm((current) => ({ ...current, expiresAt: null }))
      return
    }

    setForm((current) => {
      const base = current.expiresAt ? new Date(current.expiresAt) : new Date()
      const merged = new Date(nextDate)
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0)
      return { ...current, expiresAt: merged.toISOString() }
    })
  }

  function setExpiryTimePart(time: string) {
    if (!time) {
      return
    }

    const [hoursRaw, minutesRaw] = time.split(":")
    const hours = Number(hoursRaw)
    const minutes = Number(minutesRaw)

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return
    }

    setForm((current) => {
      const base = current.expiresAt ? new Date(current.expiresAt) : new Date()
      base.setHours(hours, minutes, 0, 0)
      return { ...current, expiresAt: base.toISOString() }
    })
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Create checkout discounts for new purchases and renewals.
        </p>
      </div>

      <CouponFormCard
        editingId={editingId}
        form={form}
        expiryDate={expiryDate}
        expiryTime={expiryTime}
        isSaving={saveCoupon.isPending}
        onCodeChange={(value) => {
          setForm((current) => ({ ...current, code: value.toUpperCase() }))
        }}
        onTypeChange={(type) => {
          if (!type) {
            return
          }
          setForm((current) => ({ ...current, type }))
        }}
        onValueChange={(value) => {
          setForm((current) => ({ ...current, value }))
        }}
        onAppliesToChange={(appliesTo) => {
          if (!appliesTo) {
            return
          }
          setForm((current) => ({ ...current, appliesTo }))
        }}
        onMaxUsesChange={(maxUses) => {
          setForm((current) => ({ ...current, maxUses }))
        }}
        onExpiryDateChange={setExpiryDatePart}
        onExpiryTimeChange={setExpiryTimePart}
        onClearExpiry={() => {
          setForm((current) => ({ ...current, expiresAt: null }))
        }}
        onActiveChange={(isActive) => {
          setForm((current) => ({ ...current, isActive }))
        }}
        onSave={() =>
          saveCoupon.mutate({
            ...form,
            id: editingId ?? undefined,
          })
        }
        onCancelEdit={() => {
          setEditingId(null)
          setForm(emptyCouponForm)
        }}
      />

      <CouponsTable
        isLoading={isLoading}
        coupons={coupons}
        onEdit={editCoupon}
        onToggle={(coupon) =>
          toggleCoupon.mutate({
            id: coupon.id,
            isActive: !coupon.isActive,
          })
        }
      />
    </section>
  )
}
