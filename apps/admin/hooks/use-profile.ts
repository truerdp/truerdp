"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface Profile {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: "user" | "admin" | "support" | "superadmin" | "manager" | string
}

export function useProfile() {
  return useQuery<Profile>({
    queryKey: queryKeys.profile(),
    queryFn: () => clientApi("/profile"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
