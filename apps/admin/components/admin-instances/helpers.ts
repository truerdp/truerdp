import { format } from "date-fns"

import type { Instance } from "@/hooks/use-all-instances"

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

export function getStatusVariant(
  status: Instance["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "suspended":
      return "destructive"
    case "pending":
    case "provisioning":
      return "outline"
    case "expired":
      return "secondary"
    case "termination_pending":
    case "terminated":
      return "destructive"
    default:
      return "secondary"
  }
}

export function getResourceStatusVariant(
  status: Instance["resourceStatus"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "released":
      return "outline"
    default:
      return "secondary"
  }
}

export function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}
