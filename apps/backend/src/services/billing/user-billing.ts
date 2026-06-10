import type { OrderBillingDetails } from "../../schema.js"

type UserBillingSource = {
  firstName: string | null
  lastName: string | null
  email: string | null
  billingPhone: string | null
  billingCompanyName: string | null
  billingTaxId: string | null
  billingAddressLine1: string | null
  billingAddressLine2: string | null
  billingCity: string | null
  billingState: string | null
  billingPostalCode: string | null
  billingCountry: string | null
}

function required(value: string | null) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function optional(value: string | null) {
  return required(value)
}

export function buildUserBillingDetails(
  user: UserBillingSource
): OrderBillingDetails | null {
  const firstName = required(user.firstName)
  const lastName = required(user.lastName)
  const email = required(user.email)
  const phone = required(user.billingPhone)
  const addressLine1 = required(user.billingAddressLine1)
  const city = required(user.billingCity)
  const state = required(user.billingState)
  const postalCode = required(user.billingPostalCode)
  const country = required(user.billingCountry)

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !addressLine1 ||
    !city ||
    !state ||
    !postalCode ||
    !country
  ) {
    return null
  }

  return {
    firstName,
    lastName,
    email,
    phone,
    companyName: optional(user.billingCompanyName),
    taxId: optional(user.billingTaxId),
    addressLine1,
    addressLine2: optional(user.billingAddressLine2),
    city,
    state,
    postalCode,
    country,
  }
}
