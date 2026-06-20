"use client"

import { BillingLocationFields } from "@workspace/ui/components/billing-location-fields"
import { DatePicker } from "@workspace/ui/components/base/date-picker"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import type { Profile } from "@/hooks/use-profile"

type AccountFormProps = {
  profile: Profile
}

export function AccountForm({ profile }: AccountFormProps) {
  const billing = profile.billingDetails

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>
          Keep your account identity current for billing, support, and dashboard
          access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="first-name">First name</FieldLabel>
              <Input id="first-name" value={profile.firstName ?? ""} disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="last-name">Last name</FieldLabel>
              <Input id="last-name" value={profile.lastName ?? ""} disabled />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" value={profile.email} disabled />
            <FieldDescription>
              Account identity is locked. Contact support if it needs an admin
              update.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="date-of-birth">Date of birth</FieldLabel>
            <DatePicker
              id="date-of-birth"
              value={profile.dateOfBirth ?? ""}
              disabled
              onChange={() => {}}
            />
          </Field>

          <div className="space-y-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Billing address</p>
              <p className="text-xs text-muted-foreground">
                Billing details are locked after signup. Raise a support ticket
                if this address needs an admin update.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="billing-phone">Phone</FieldLabel>
              <PhoneInput
                id="billing-phone"
                value={billing?.phone ?? ""}
                disabled
                onChange={() => {}}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-name">Company</FieldLabel>
                <Input
                  id="company-name"
                  value={billing?.companyName ?? ""}
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tax-id">GST/VAT ID</FieldLabel>
                <Input id="tax-id" value={billing?.taxId ?? ""} disabled />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="address-line-1">Address line 1</FieldLabel>
              <Input
                id="address-line-1"
                value={billing?.addressLine1 ?? ""}
                disabled
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="address-line-2">Address line 2</FieldLabel>
              <Input
                id="address-line-2"
                value={billing?.addressLine2 ?? ""}
                disabled
              />
            </Field>
            <BillingLocationFields
              country={billing?.country ?? ""}
              state={billing?.state ?? ""}
              city={billing?.city ?? ""}
              disabled
              onCountryChange={() => {}}
              onStateChange={() => {}}
              onCityChange={() => {}}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="postal-code">Postal code</FieldLabel>
                <Input
                  id="postal-code"
                  value={billing?.postalCode ?? ""}
                  disabled
                />
              </Field>
            </div>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
