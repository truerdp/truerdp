"use client"

import { FormEvent, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Spinner } from "@workspace/ui/components/spinner"
import type { BillingDetails, Profile } from "@/hooks/use-profile"
import { queryKeys } from "@/lib/query-keys"

type AccountFormProps = {
  profile: Profile
}

type BillingFormState = Omit<BillingDetails, "firstName" | "lastName" | "email">

const emptyBillingForm: BillingFormState = {
  phone: "",
  companyName: "",
  taxId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
}

export function AccountForm({ profile }: AccountFormProps) {
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [billing, setBilling] = useState<BillingFormState>(emptyBillingForm)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setFirstName(profile.firstName ?? "")
    setLastName(profile.lastName ?? "")
    setEmail(profile.email)
    setBilling({
      phone: profile.billingDetails?.phone ?? "",
      companyName: profile.billingDetails?.companyName ?? "",
      taxId: profile.billingDetails?.taxId ?? "",
      addressLine1: profile.billingDetails?.addressLine1 ?? "",
      addressLine2: profile.billingDetails?.addressLine2 ?? "",
      city: profile.billingDetails?.city ?? "",
      state: profile.billingDetails?.state ?? "",
      postalCode: profile.billingDetails?.postalCode ?? "",
      country: profile.billingDetails?.country ?? "",
    })
  }, [profile])

  function updateBillingField<K extends keyof BillingFormState>(
    key: K,
    value: BillingFormState[K]
  ) {
    setBilling((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Name and email are required.")
      return
    }

    if (
      !billing.phone.trim() ||
      !billing.addressLine1.trim() ||
      !billing.city.trim() ||
      !billing.state.trim() ||
      !billing.postalCode.trim() ||
      !billing.country.trim()
    ) {
      setError("Complete the required billing address fields.")
      return
    }

    try {
      setIsSaving(true)
      const updated = await clientApi<Profile>("/profile", {
        method: "PATCH",
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          billingDetails: {
            phone: billing.phone.trim(),
            companyName: billing.companyName?.trim() || null,
            taxId: billing.taxId?.trim() || null,
            addressLine1: billing.addressLine1.trim(),
            addressLine2: billing.addressLine2?.trim() || null,
            city: billing.city.trim(),
            state: billing.state.trim(),
            postalCode: billing.postalCode.trim(),
            country: billing.country.trim(),
          },
        },
      })

      queryClient.setQueryData(queryKeys.profile(), updated)
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile() })
      toast.success("Profile updated")
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to update profile"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

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
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="first-name">First name</FieldLabel>
                <Input
                  id="first-name"
                  value={firstName}
                  disabled={isSaving}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                <Input
                  id="last-name"
                  value={lastName}
                  disabled={isSaving}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                disabled={isSaving}
                onChange={(event) => setEmail(event.target.value)}
              />
              <FieldDescription>
                This email is used for login and account communication.
              </FieldDescription>
            </Field>

            <div className="space-y-4 border-t pt-4">
              <div>
                <p className="text-sm font-medium">Billing address</p>
                <p className="text-xs text-muted-foreground">
                  This address is copied to new purchases and invoices.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="billing-phone">Phone</FieldLabel>
                <PhoneInput
                  id="billing-phone"
                  value={billing.phone}
                  disabled={isSaving}
                  onChange={(value) =>
                    updateBillingField("phone", value?.toString() ?? "")
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="company-name">Company</FieldLabel>
                  <Input
                    id="company-name"
                    value={billing.companyName ?? ""}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateBillingField("companyName", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tax-id">GST/VAT ID</FieldLabel>
                  <Input
                    id="tax-id"
                    value={billing.taxId ?? ""}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateBillingField("taxId", event.target.value)
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="address-line-1">Address line 1</FieldLabel>
                <Input
                  id="address-line-1"
                  value={billing.addressLine1}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateBillingField("addressLine1", event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="address-line-2">Address line 2</FieldLabel>
                <Input
                  id="address-line-2"
                  value={billing.addressLine2 ?? ""}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateBillingField("addressLine2", event.target.value)
                  }
                />
              </Field>
              <BillingLocationFields
                country={billing.country}
                state={billing.state}
                city={billing.city}
                disabled={isSaving}
                onCountryChange={(value) =>
                  updateBillingField("country", value)
                }
                onStateChange={(value) => updateBillingField("state", value)}
                onCityChange={(value) => updateBillingField("city", value)}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="postal-code">Postal code</FieldLabel>
                  <Input
                    id="postal-code"
                    value={billing.postalCode}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateBillingField("postalCode", event.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            {error ? <FieldError>{error}</FieldError> : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner data-icon="inline-start" />}
                Save changes
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
