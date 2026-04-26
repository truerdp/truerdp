"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { queryKeys } from "@/lib/query-keys"

type Coupon = {
  id: number
  code: string
  type: "percent" | "flat"
  value: number
  appliesTo: "all" | "new_purchase" | "renewal"
  maxUses: number | null
  expiresAt: string | null
  isActive: boolean
  usageCount: number
}

type CouponInput = {
  code: string
  type: "percent" | "flat"
  value: number
  appliesTo: "all" | "new_purchase" | "renewal"
  maxUses: number | null
  expiresAt: string | null
  isActive: boolean
}

const emptyForm: CouponInput = {
  code: "",
  type: "percent",
  value: 10,
  appliesTo: "all",
  maxUses: null,
  expiresAt: null,
  isActive: true,
}

function formatCouponValue(coupon: Coupon) {
  return coupon.type === "percent"
    ? `${coupon.value}%`
    : `$${(coupon.value / 100).toFixed(2)}`
}

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export default function CouponsPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CouponInput>(emptyForm)
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
      setForm(emptyForm)
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

  const expiryDate = form.expiresAt ? new Date(form.expiresAt) : null
  const expiryTime = expiryDate ? formatTimeValue(expiryDate) : ""

  function setExpiryDatePart(nextDate: Date | undefined) {
    if (!nextDate) {
      setForm((current) => ({ ...current, expiresAt: null }))
      return
    }

    setForm((current) => {
      const base = current.expiresAt ? new Date(current.expiresAt) : new Date()
      const merged = new Date(nextDate)
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0)
      return {
        ...current,
        expiresAt: merged.toISOString(),
      }
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
      return {
        ...current,
        expiresAt: base.toISOString(),
      }
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

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit coupon" : "Create coupon"}</CardTitle>
          <CardDescription>
            Flat values are stored in USD cents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Code</FieldLabel>
            <Input
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="WELCOME10"
            />
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  type: value as CouponInput["type"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Value</FieldLabel>
            <Input
              type="number"
              min={1}
              value={form.value}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  value: Number(event.target.value),
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Applies to</FieldLabel>
            <Select
              value={form.appliesTo}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  appliesTo: value as CouponInput["appliesTo"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new_purchase">New purchases</SelectItem>
                <SelectItem value="renewal">Renewals</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Max uses</FieldLabel>
            <Input
              type="number"
              min={1}
              value={form.maxUses ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  maxUses: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
              placeholder="Unlimited"
            />
          </Field>
          <Field>
            <FieldLabel>Expires at</FieldLabel>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger
                  render={<Button variant="outline" className="w-full justify-start" />}
                >
                  {expiryDate
                    ? format(expiryDate, "MMM d, yyyy")
                    : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate ?? undefined}
                    onSelect={setExpiryDatePart}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={expiryTime}
                  disabled={!expiryDate}
                  onChange={(event) => setExpiryTimePart(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({ ...current, expiresAt: null }))
                  }
                  disabled={!expiryDate}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Field>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(isActive) =>
                setForm((current) => ({ ...current, isActive }))
              }
            />
            <span className="text-sm">Active</span>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button
              onClick={() =>
                saveCoupon.mutate({
                  ...form,
                  id: editingId ?? undefined,
                })
              }
              disabled={saveCoupon.isPending || !form.code.trim()}
            >
              {editingId ? "Update coupon" : "Create coupon"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Applies to</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading coupons...</TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No coupons created yet.</TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono">{coupon.code}</TableCell>
                  <TableCell>{formatCouponValue(coupon)}</TableCell>
                  <TableCell>{coupon.appliesTo.replaceAll("_", " ")}</TableCell>
                  <TableCell>
                    {coupon.usageCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? "default" : "outline"}>
                      {coupon.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editCoupon(coupon)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleCoupon.mutate({
                            id: coupon.id,
                            isActive: !coupon.isActive,
                          })
                        }
                      >
                        {coupon.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
