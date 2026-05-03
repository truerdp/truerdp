import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Spinner } from "@workspace/ui/components/spinner"
import type { BillingFormValues } from "./billing-form"

interface BillingDetailsPanelProps {
  errors: FieldErrors<BillingFormValues>
  control: Control<BillingFormValues>
  register: UseFormRegister<BillingFormValues>
  isSavingBilling: boolean
  hasSavedBillingDetails: boolean
  canSave: boolean
  onSave: () => void
}

export function BillingDetailsPanel({
  errors,
  control,
  register,
  isSavingBilling,
  hasSavedBillingDetails,
  canSave,
  onSave,
}: BillingDetailsPanelProps) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Billing information</p>
          <p className="text-xs text-muted-foreground">
            This data is saved with the order and used for invoicing.
          </p>
        </div>
        <Badge variant={hasSavedBillingDetails ? "secondary" : "outline"}>
          {hasSavedBillingDetails ? "Saved" : "Required"}
        </Badge>
      </div>

      <FieldGroup>
        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="billing-first-name">First name *</FieldLabel>
          <Input
            id="billing-first-name"
            {...register("firstName")}
            placeholder="First name"
            disabled={isSavingBilling}
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName ? <FieldError>{errors.firstName.message}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="billing-last-name">Last name *</FieldLabel>
          <Input
            id="billing-last-name"
            {...register("lastName")}
            placeholder="Last name"
            disabled={isSavingBilling}
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName ? <FieldError>{errors.lastName.message}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="billing-email">Billing email *</FieldLabel>
          <Input
            id="billing-email"
            type="email"
            {...register("email")}
            placeholder="Billing email"
            disabled={isSavingBilling}
            aria-invalid={!!errors.email}
          />
          {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="billing-phone">Phone *</FieldLabel>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="billing-phone"
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
                onBlur={field.onBlur}
                name={field.name}
                placeholder="Phone"
                disabled={isSavingBilling}
                aria-invalid={!!errors.phone}
                className="w-full"
              />
            )}
          />
          {errors.phone ? <FieldError>{errors.phone.message}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="billing-company">Company</FieldLabel>
          <Input
            id="billing-company"
            {...register("companyName")}
            placeholder="Company (optional)"
            disabled={isSavingBilling}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="billing-tax-id">GST/VAT ID</FieldLabel>
          <Input
            id="billing-tax-id"
            {...register("taxId")}
            placeholder="GST/VAT ID (optional)"
            disabled={isSavingBilling}
          />
        </Field>
        <Field data-invalid={!!errors.addressLine1}>
          <FieldLabel htmlFor="billing-address-line-1">Address line 1 *</FieldLabel>
          <Input
            id="billing-address-line-1"
            {...register("addressLine1")}
            placeholder="Address line 1"
            disabled={isSavingBilling}
            aria-invalid={!!errors.addressLine1}
          />
          {errors.addressLine1 ? (
            <FieldError>{errors.addressLine1.message}</FieldError>
          ) : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="billing-address-line-2">Address line 2</FieldLabel>
          <Input
            id="billing-address-line-2"
            {...register("addressLine2")}
            placeholder="Address line 2 (optional)"
            disabled={isSavingBilling}
          />
        </Field>
        <Field data-invalid={!!errors.city}>
          <FieldLabel htmlFor="billing-city">City *</FieldLabel>
          <Input
            id="billing-city"
            {...register("city")}
            placeholder="City"
            disabled={isSavingBilling}
            aria-invalid={!!errors.city}
          />
          {errors.city ? <FieldError>{errors.city.message}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors.state}>
          <FieldLabel htmlFor="billing-state">State/Region *</FieldLabel>
          <Input
            id="billing-state"
            {...register("state")}
            placeholder="State/Region"
            disabled={isSavingBilling}
            aria-invalid={!!errors.state}
          />
          {errors.state ? <FieldError>{errors.state.message}</FieldError> : null}
        </Field>
        <Field data-invalid={!!errors.postalCode}>
          <FieldLabel htmlFor="billing-postal-code">Postal code *</FieldLabel>
          <Input
            id="billing-postal-code"
            {...register("postalCode")}
            placeholder="Postal code"
            disabled={isSavingBilling}
            aria-invalid={!!errors.postalCode}
          />
          {errors.postalCode ? (
            <FieldError>{errors.postalCode.message}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={!!errors.country}>
          <FieldLabel htmlFor="billing-country">Country *</FieldLabel>
          <Input
            id="billing-country"
            {...register("country")}
            placeholder="Country"
            disabled={isSavingBilling}
            aria-invalid={!!errors.country}
          />
          {errors.country ? <FieldError>{errors.country.message}</FieldError> : null}
        </Field>
      </FieldGroup>

      {errors.root?.message ? (
        <FieldError className="mt-3">{errors.root.message}</FieldError>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onSave} disabled={!canSave}>
          {isSavingBilling && <Spinner data-icon="inline-start" />}
          Save billing details
        </Button>
      </div>
    </div>
  )
}
