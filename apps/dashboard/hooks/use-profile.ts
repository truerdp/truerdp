"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { getAuthToken } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"

export interface Profile {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: "user" | "admin" | "support" | "superadmin" | "manager" | string
}

export function useProfile() {
  const token = getAuthToken()

  return useQuery<Profile>({
    queryKey: queryKeys.profile(),
    queryFn: () => api("/profile"),
    staleTime: 5 * 60 * 1000,
    enabled: !!token,
  })
}
