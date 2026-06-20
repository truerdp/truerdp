"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"
import { queryKeys } from "@/lib/query-keys"

export interface BillingDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string | null
  taxId: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Profile {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  role: "user" | "admin" | "support" | "superadmin" | "manager" | string
  billingDetails: BillingDetails | null
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: queryKeys.profile(),
    queryFn: () => clientApi("/profile"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
