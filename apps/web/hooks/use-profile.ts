"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"

export interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  role: "admin" | "user" | "operator"
  createdAt: string
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => clientApi("/profile"),
    retry: false,
  })
}
