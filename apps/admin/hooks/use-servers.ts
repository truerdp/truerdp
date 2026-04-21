"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

export interface ServerInventoryItem {
  id: number
  provider: string
  externalId: string | null
  ipAddress: string
  cpu: number
  ram: number
  storage: number
  status: "available" | "assigned" | "cleaning" | "retired"
  lastAssignedAt: string | null
  createdAt: string
  updatedAt: string
  activeResourceId: number | null
  activeInstanceId: number | null
  activeResourceUsername: string | null
}

export interface CreateServerInput {
  provider: string
  externalId?: string | null
  ipAddress: string
  cpu: number
  ram: number
  storage: number
  status: ServerInventoryItem["status"]
}

export function useServers() {
  return useQuery<ServerInventoryItem[]>({
    queryKey: queryKeys.servers(),
    queryFn: () => clientApi("/admin/servers"),
  })
}

export function useCreateServer() {
  const queryClient = useQueryClient()

  return useMutation<
    { message: string; server: ServerInventoryItem },
    Error,
    CreateServerInput
  >({
    mutationFn: (input) =>
      clientApi("/admin/servers", {
        method: "POST",
        body: input,
      }),
    onSuccess: async () => {
      toast.success("Server created successfully")
      await queryClient.invalidateQueries({ queryKey: queryKeys.servers() })
      await queryClient.invalidateQueries({
        queryKey: ["servers", "available"],
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create server")
    },
  })
}

export function useUpdateServerStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    { message: string; server: ServerInventoryItem },
    Error,
    { serverId: number; status: ServerInventoryItem["status"] }
  >({
    mutationFn: ({ serverId, status }) =>
      clientApi(`/admin/servers/${serverId}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: async () => {
      toast.success("Server status updated successfully")
      await queryClient.invalidateQueries({ queryKey: queryKeys.servers() })
      await queryClient.invalidateQueries({
        queryKey: ["servers", "available"],
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update server status")
    },
  })
}
