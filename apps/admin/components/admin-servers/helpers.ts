import type { ServerInventoryItem } from "@/hooks/use-servers"

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function getStatusVariant(
  status: ServerInventoryItem["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "available":
      return "default"
    case "assigned":
      return "secondary"
    case "cleaning":
      return "outline"
    case "retired":
      return "destructive"
    default:
      return "secondary"
  }
}

export function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

export function getServerSummary(servers: ServerInventoryItem[]) {
  return servers.reduce(
    (accumulator, server) => {
      accumulator.total += 1
      accumulator[server.status] += 1
      return accumulator
    },
    {
      total: 0,
      available: 0,
      assigned: 0,
      cleaning: 0,
      retired: 0,
    }
  )
}
