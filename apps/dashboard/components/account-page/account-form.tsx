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

type SupportPrefill = {
  subject: string
  message: string
}

export function AccountForm({ profile }: AccountFormProps) {
  const billing = profile.billingDetails
  const supportPrefill = buildLockedProfileSupportPrefill(profile)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>
          <SupportPrefillButton prefill={supportPrefill} /> if you need an admin
          to update locked profile or billing details.
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

function SupportPrefillButton({ prefill }: { prefill: SupportPrefill }) {
  return (
    <form action="/support/prefill" method="post" className="inline">
      <input type="hidden" name="subject" value={prefill.subject} />
      <input type="hidden" name="message" value={prefill.message} />
      <button
        type="submit"
        className="cursor-pointer bg-transparent p-0 text-left text-primary underline-offset-4 hover:underline"
      >
        Open a prefilled support ticket
      </button>
    </form>
  )
}

function buildLockedProfileSupportPrefill(profile: Profile) {
  const billing = profile.billingDetails
  return {
    subject: "Locked profile or billing change request",
    message: [
      "I need help updating locked account information.",
      "",
      `Customer ID: ${profile.id}`,
      `Account email: ${profile.email}`,
      `Name on profile: ${
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "-"
      }`,
      `Date of birth on profile: ${profile.dateOfBirth || "-"}`,
      "",
      "Current billing profile:",
      `Billing email: ${billing?.email || "-"}`,
      `Phone: ${billing?.phone || "-"}`,
      `Company: ${billing?.companyName || "-"}`,
      `GST/VAT ID: ${billing?.taxId || "-"}`,
      `Address line 1: ${billing?.addressLine1 || "-"}`,
      `Address line 2: ${billing?.addressLine2 || "-"}`,
      `City: ${billing?.city || "-"}`,
      `State/Region: ${billing?.state || "-"}`,
      `Postal code: ${billing?.postalCode || "-"}`,
      `Country: ${billing?.country || "-"}`,
      "",
      "Requested change:",
      "",
    ].join("\n"),
  }
}
