"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"

interface RenewButtonProps {
  instanceId: number
  disabled?: boolean
}

export default function RenewButton({
  instanceId,
  disabled = false,
}: RenewButtonProps) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      return api(`/instances/${instanceId}/renew`, {
        method: "POST",
        body: JSON.stringify({}),
      })
    },
    onSuccess: () => {
      setMessage("Renewal initiated. Awaiting confirmation.")

      // ✅ refresh instance data
      queryClient.invalidateQueries({
        queryKey: ["instance", instanceId],
      })

      // optional: refresh list
      queryClient.invalidateQueries({
        queryKey: ["instances"],
      })
    },
    onError: () => {
      setMessage("Failed to initiate renewal")
    },
  })

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        disabled={mutation.isPending || disabled}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Processing..." : "Renew"}
      </Button>

      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  )
}
