"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { toast } from "sonner"

import { clientApi } from "@workspace/api/client"
import { BillingLocationFields } from "@workspace/ui/components/billing-location-fields"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Spinner } from "@workspace/ui/components/spinner"
import { queryKeys } from "@/lib/query-keys"
import type { AdminUser360Details } from "@/hooks/use-user-details"

type BillingProfile = NonNullable<AdminUser360Details["billingProfile"]>

type BillingProfileForm = Omit<
  BillingProfile,
  "firstName" | "lastName"
> & {
  reason: string
}

type BillingProfileCardProps = {
  data: AdminUser360Details
}

export function BillingProfileCard({ data }: BillingProfileCardProps) {
  const [ticketId] = useQueryState("ticket", parseAsString)
  const ticketReference = getTicketReference(ticketId)
  const formKey = getBillingProfileFormKey(data, ticketReference)

  return (
    <BillingProfileCardContent
      key={formKey}
      data={data}
      ticketReference={ticketReference}
    />
  )
}

function BillingProfileCardContent({
  data,
  ticketReference,
}: BillingProfileCardProps & {
  ticketReference: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<BillingProfileForm>(() =>
    getInitialBillingProfileForm(data, ticketReference)
  )
  const [error, setError] = useState<string | null>(null)

  const updateBillingProfile = useMutation({
    mutationFn: () =>
      clientApi(`/admin/users/${data.user.id}/billing`, {
        method: "PATCH",
        body: {
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          companyName: normalizeOptional(form.companyName),
          taxId: normalizeOptional(form.taxId),
          addressLine1: form.addressLine1.trim(),
          addressLine2: normalizeOptional(form.addressLine2),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
          reason: form.reason.trim(),
        },
      }),
    onSuccess: async () => {
      toast.success("Billing profile updated")
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.userDetails(data.user.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users() }),
      ])
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update billing profile"
      )
    },
  })

  function updateField<K extends keyof BillingProfileForm>(
    key: K,
    value: BillingProfileForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim() ||
      !form.country.trim()
    ) {
      setError("Complete the required billing contact and address fields.")
      return
    }

    if (!form.email.includes("@")) {
      setError("Enter a valid customer email.")
      return
    }

    if (form.reason.trim().length < 3) {
      setError("Add a reason or support ticket reference.")
      return
    }

    updateBillingProfile.mutate()
  }

  const isSaving = updateBillingProfile.isPending

  return (
    <Card id="billing-profile">
      <CardHeader>
        <CardTitle>Stored Billing Profile</CardTitle>
        <CardDescription>
          Admin-only update path for support-approved billing address changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <Input
                  value={`${data.user.firstName} ${data.user.lastName}`.trim()}
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-billing-email">Email</FieldLabel>
                <Input
                  id="admin-billing-email"
                  type="email"
                  value={form.email}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="admin-billing-phone">Phone</FieldLabel>
              <PhoneInput
                id="admin-billing-phone"
                value={form.phone}
                disabled={isSaving}
                onChange={(value) =>
                  updateField("phone", value?.toString() ?? "")
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="admin-billing-company">Company</FieldLabel>
                <Input
                  id="admin-billing-company"
                  value={form.companyName ?? ""}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField("companyName", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-billing-tax-id">
                  GST/VAT ID
                </FieldLabel>
                <Input
                  id="admin-billing-tax-id"
                  value={form.taxId ?? ""}
                  disabled={isSaving}
                  onChange={(event) => updateField("taxId", event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="admin-billing-address-line-1">
                Address line 1
              </FieldLabel>
              <Input
                id="admin-billing-address-line-1"
                value={form.addressLine1}
                disabled={isSaving}
                onChange={(event) =>
                  updateField("addressLine1", event.target.value)
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-billing-address-line-2">
                Address line 2
              </FieldLabel>
              <Input
                id="admin-billing-address-line-2"
                value={form.addressLine2 ?? ""}
                disabled={isSaving}
                onChange={(event) =>
                  updateField("addressLine2", event.target.value)
                }
              />
            </Field>
            <BillingLocationFields
              ids={{
                country: "admin-billing-country",
                state: "admin-billing-state",
                city: "admin-billing-city",
              }}
              country={form.country}
              state={form.state}
              city={form.city}
              disabled={isSaving}
              onCountryChange={(value) => updateField("country", value)}
              onStateChange={(value) => updateField("state", value)}
              onCityChange={(value) => updateField("city", value)}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="admin-billing-postal-code">
                  Postal code
                </FieldLabel>
                <Input
                  id="admin-billing-postal-code"
                  value={form.postalCode}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-billing-reason">
                  Reason / ticket reference
                </FieldLabel>
                <Input
                  id="admin-billing-reason"
                  value={form.reason}
                  disabled={isSaving}
                  placeholder="Support ticket or reason"
                  onChange={(event) =>
                    updateField("reason", event.target.value)
                  }
                />
              </Field>
            </div>
            {error ? <FieldError>{error}</FieldError> : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner data-icon="inline-start" /> : null}
                Update billing profile
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function normalizeOptional(value: string | null) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function prefillValue(
  storedValue: string | null | undefined,
  fallbackValue: string | null | undefined
) {
  const stored = storedValue?.trim() ?? ""
  if (stored.length > 0) {
    return stored
  }

  return fallbackValue?.trim() ?? ""
}

function getTicketReference(ticketId: string | null) {
  return ticketId && /^\d+$/.test(ticketId) ? `Support ticket #${ticketId}` : ""
}

function getInitialBillingProfileForm(
  data: AdminUser360Details,
  ticketReference: string
): BillingProfileForm {
  const billingProfile = data.billingProfile
  const latestBillingDetails = data.latestBillingDetails

  return {
    email: prefillValue(
      billingProfile?.email,
      latestBillingDetails?.email ?? data.user.email
    ),
    phone: prefillValue(billingProfile?.phone, latestBillingDetails?.phone),
    companyName: prefillValue(
      billingProfile?.companyName,
      latestBillingDetails?.companyName
    ),
    taxId: prefillValue(billingProfile?.taxId, latestBillingDetails?.taxId),
    addressLine1: prefillValue(
      billingProfile?.addressLine1,
      latestBillingDetails?.addressLine1
    ),
    addressLine2: prefillValue(
      billingProfile?.addressLine2,
      latestBillingDetails?.addressLine2
    ),
    city: prefillValue(billingProfile?.city, latestBillingDetails?.city),
    state: prefillValue(billingProfile?.state, latestBillingDetails?.state),
    postalCode: prefillValue(
      billingProfile?.postalCode,
      latestBillingDetails?.postalCode
    ),
    country: prefillValue(
      billingProfile?.country,
      latestBillingDetails?.country
    ),
    reason: ticketReference,
  }
}

function getBillingProfileFormKey(
  data: AdminUser360Details,
  ticketReference: string
) {
  const initialForm = getInitialBillingProfileForm(data, ticketReference)

  return JSON.stringify({
    userId: data.user.id,
    ...initialForm,
  })
}
