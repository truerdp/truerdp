import { format } from "date-fns"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Calendar } from "@workspace/ui/components/calendar"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import type { CouponInput } from "@/app/coupons/models"

type CouponFormCardProps = {
  editingId: number | null
  form: CouponInput
  expiryDate: Date | null
  expiryTime: string
  isSaving: boolean
  onCodeChange: (value: string) => void
  onTypeChange: (value: CouponInput["type"] | null) => void
  onValueChange: (value: number) => void
  onAppliesToChange: (value: CouponInput["appliesTo"] | null) => void
  onMaxUsesChange: (value: number | null) => void
  onExpiryDateChange: (value: Date | undefined) => void
  onExpiryTimeChange: (value: string) => void
  onClearExpiry: () => void
  onActiveChange: (value: boolean) => void
  onSave: () => void
  onCancelEdit: () => void
}

export function CouponFormCard({
  editingId,
  form,
  expiryDate,
  expiryTime,
  isSaving,
  onCodeChange,
  onTypeChange,
  onValueChange,
  onAppliesToChange,
  onMaxUsesChange,
  onExpiryDateChange,
  onExpiryTimeChange,
  onClearExpiry,
  onActiveChange,
  onSave,
  onCancelEdit,
}: CouponFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingId ? "Edit coupon" : "Create coupon"}</CardTitle>
        <CardDescription>Flat values are stored in USD cents.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel>Code</FieldLabel>
          <Input
            value={form.code}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="WELCOME10"
          />
        </Field>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <Select value={form.type} onValueChange={onTypeChange}>
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
            onChange={(event) => onValueChange(Number(event.target.value))}
          />
        </Field>
        <Field>
          <FieldLabel>Applies to</FieldLabel>
          <Select value={form.appliesTo} onValueChange={onAppliesToChange}>
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
              onMaxUsesChange(event.target.value ? Number(event.target.value) : null)
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
                {expiryDate ? format(expiryDate, "MMM d, yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiryDate ?? undefined}
                  onSelect={onExpiryDateChange}
                />
              </PopoverContent>
            </Popover>
            <div className="flex gap-2">
              <Input
                type="time"
                value={expiryTime}
                disabled={!expiryDate}
                onChange={(event) => onExpiryTimeChange(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onClearExpiry}
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
            onCheckedChange={onActiveChange}
          />
          <span className="text-sm">Active</span>
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <Button onClick={onSave} disabled={isSaving || !form.code.trim()}>
            {editingId ? "Update coupon" : "Create coupon"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
