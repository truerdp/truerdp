"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@workspace/api"
import { getAuthToken } from "@/lib/auth"

export interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "admin" | "user"
  createdAt: string
}

export function useProfile() {
  const token = getAuthToken()

  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => api("/profile"),
    enabled: Boolean(token),
    retry: false,
  })
}
