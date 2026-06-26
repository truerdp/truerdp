"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientApi } from "@workspace/api/client"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"
import {
  buildWebhookEventSearchParams,
  type WebhookEventResponse,
} from "@/app/webhook-events/models"

export default function WebhookEventsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("failed")
  const [provider, setProvider] = useState("all")

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      status,
      provider,
    }),
    [page, provider, status]
  )

  const eventsQuery = useQuery<WebhookEventResponse>({
    queryKey: queryKeys.webhookEvents(params),
    queryFn: () => {
      const searchParams = buildWebhookEventSearchParams(params)
      return clientApi(`/admin/webhook-events?${searchParams.toString()}`)
    },
  })

  const reprocessMutation = useMutation({
    mutationFn: (eventId: number) =>
      clientApi(`/admin/webhook-events/${eventId}/reprocess`, {
        method: "POST",
      }),
    onSuccess: async () => {
      toast.success("Webhook event reprocessed")
      await queryClient.invalidateQueries({
        queryKey: queryKeys.webhookEvents(params),
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to reprocess webhook event")
    },
  })

  const items = eventsQuery.data?.items ?? []
  const pagination = eventsQuery.data?.pagination

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-sm text-muted-foreground">
          Review payment webhook deliveries and reprocess failed events.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="ignored">Ignored</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={provider}
          onValueChange={(value) => {
            setProvider(value ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            <SelectItem value="dodo">Dodo</SelectItem>
            <SelectItem value="coingate">CoinGate</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="mock">Mock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-sm text-muted-foreground"
                >
                  {eventsQuery.isLoading
                    ? "Loading webhook events..."
                    : "No webhook events found."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">#{item.id}</span>
                      <span className="max-w-56 truncate text-xs text-muted-foreground">
                        {item.eventId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {item.provider}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "failed" ? "destructive" : "secondary"
                      }
                      className="uppercase"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-mono text-xs">
                    {item.externalReference ?? "-"}
                  </TableCell>
                  <TableCell className="max-w-72 text-xs">
                    {item.errorMessage ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      disabled={reprocessMutation.isPending}
                      onClick={() => reprocessMutation.mutate(item.id)}
                    >
                      {reprocessMutation.isPending ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      Reprocess
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} -{" "}
            {pagination.totalCount} total
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((value) => Math.min(pagination.totalPages, value + 1))
              }
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
