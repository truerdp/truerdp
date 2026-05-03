import z from "zod"

import type { OrderBillingDetails } from "@/hooks/use-order"

export interface BillingFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  taxId: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export const billingFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Billing email is required")
    .email("Valid billing email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  companyName: z.string().trim(),
  taxId: z.string().trim(),
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: z.string().trim(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
})

export const emptyBillingForm: BillingFormValues = {
  firstName: "",
  lastName: "",
  email: "",
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

export function toBillingFormValues(
  details: OrderBillingDetails | null | undefined,
  fallbackProfile: { firstName: string; lastName: string; email: string } | null
): BillingFormValues {
  if (details) {
    return {
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email,
      phone: details.phone ?? "",
      companyName: details.companyName ?? "",
      taxId: details.taxId ?? "",
      addressLine1: details.addressLine1,
      addressLine2: details.addressLine2 ?? "",
      city: details.city,
      state: details.state,
      postalCode: details.postalCode,
      country: details.country,
    }
  }

  if (fallbackProfile) {
    return {
      ...emptyBillingForm,
      firstName: fallbackProfile.firstName,
      lastName: fallbackProfile.lastName,
      email: fallbackProfile.email,
    }
  }

  return emptyBillingForm
}

export function buildBillingPayload(values: BillingFormValues): OrderBillingDetails {
  const normalizeRequired = (value: string) => value.trim()
  const normalizeOptional = (value: string) => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return {
    firstName: normalizeRequired(values.firstName),
    lastName: normalizeRequired(values.lastName),
    email: normalizeRequired(values.email).toLowerCase(),
    phone: normalizeRequired(values.phone),
    companyName: normalizeOptional(values.companyName),
    taxId: normalizeOptional(values.taxId),
    addressLine1: normalizeRequired(values.addressLine1),
    addressLine2: normalizeOptional(values.addressLine2),
    city: normalizeRequired(values.city),
    state: normalizeRequired(values.state),
    postalCode: normalizeRequired(values.postalCode),
    country: normalizeRequired(values.country),
  }
}
