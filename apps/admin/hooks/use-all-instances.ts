"use client"

import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { queryKeys } from "@/lib/query-keys"

export interface Instance {
  id: number
  userId: number
  status:
    | "pending"
    | "provisioning"
    | "active"
    | "suspended"
    | "expired"
    | "termination_pending"
    | "terminated"
    | "failed"
  startDate: string | null
  expiryDate: string | null
  ipAddress: string | null
  provider: string | null
  resourceStatus: "active" | "released" | null
  extensionCount: number
  lastExtensionAt: string | null
  lastExtensionDays: number | null
}

export interface AdminInstanceListResponse {
  items: Instance[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface AdminInstanceListQuery {
  page?: number
  pageSize?: number
}

function buildInstanceQueryString(query: AdminInstanceListQuery) {
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(query.page ?? 1))
  searchParams.set("pageSize", String(query.pageSize ?? 20))
  return searchParams.toString()
}

export function useAllInstances(query: AdminInstanceListQuery) {
  return useQuery<AdminInstanceListResponse>({
    queryKey: [...queryKeys.allInstances(), query],
    queryFn: async () => {
      const response = await clientApi<AdminInstanceListResponse | Instance[]>(
        `/admin/instances?${buildInstanceQueryString(query)}`
      )

      if (Array.isArray(response)) {
        const page = query.page ?? 1
        const pageSize = query.pageSize ?? 20
        const totalCount = response.length
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
        const clampedPage = Math.min(page, totalPages)
        const offset = (clampedPage - 1) * pageSize

        return {
          items: response.slice(offset, offset + pageSize),
          pagination: {
            page: clampedPage,
            pageSize,
            totalCount,
            totalPages,
          },
        }
      }

      return response
    },
  })
}
