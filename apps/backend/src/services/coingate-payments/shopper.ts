import type { CoinGateShopperInput } from "./types.js"

type CoinGateShopperPayload = {
  type: "business" | "personal"
  ip_address?: string
  email?: string
  first_name?: string
  last_name?: string
  residence_address?: string
  residence_postal_code?: string
  residence_city?: string
  residence_country?: string
  company_details?: {
    name: string
    code?: string
    address?: string
    postal_code?: string
    city?: string
    country?: string
  }
}

const countryNameToIso2: Record<string, string> = {
  india: "IN",
  bharat: "IN",
  ind: "IN",
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  uk: "GB",
  "united kingdom": "GB",
  england: "GB",
  uae: "AE",
  "united arab emirates": "AE",
  russia: "RU",
  vietnam: "VN",
  "south korea": "KR",
  "north korea": "KP",
  "czech republic": "CZ",
}

function normalizeCountryLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
}

function normalizeCountryToIso2(value: string | null | undefined) {
  const raw = value?.trim()

  if (!raw) {
    return ""
  }

  if (/^[A-Za-z]{2}$/.test(raw)) {
    return raw.toUpperCase()
  }

  return countryNameToIso2[normalizeCountryLookupKey(raw)] ?? ""
}

function trimmedOptional(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

export function buildCoinGateShopperPayload(input?: CoinGateShopperInput | null) {
  if (!input) {
    return null
  }

  const country = normalizeCountryToIso2(input.country) || undefined
  const address = [input.addressLine1, input.addressLine2]
    .map((part) => trimmedOptional(part))
    .filter(Boolean)
    .join(", ")
  const companyName = trimmedOptional(input.companyName)
  const type = companyName ? "business" : "personal"
  const shopper: CoinGateShopperPayload = {
    type,
    ip_address: trimmedOptional(input.ipAddress),
    email: trimmedOptional(input.email),
    first_name: trimmedOptional(input.firstName),
    last_name: trimmedOptional(input.lastName),
  }

  if (companyName) {
    shopper.company_details = {
      name: companyName,
      code: trimmedOptional(input.taxId),
      address: address || undefined,
      postal_code: trimmedOptional(input.postalCode),
      city: trimmedOptional(input.city),
      country,
    }
  } else {
    shopper.residence_address = address || undefined
    shopper.residence_postal_code = trimmedOptional(input.postalCode)
    shopper.residence_city = trimmedOptional(input.city)
    shopper.residence_country = country
  }

  const hasShopperDetails = Object.entries(shopper).some(
    ([key, value]) => key !== "type" && value
  )

  if (!hasShopperDetails) {
    return null
  }

  return shopper
}
