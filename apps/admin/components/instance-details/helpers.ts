import { format } from "date-fns"

import type { InstanceDetails } from "@/hooks/use-instance-details"

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy HH:mm")
}

export function getStatusVariant(
  status: string
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
    case "terminated":
    case "failed":
      return "destructive"
    case "termination_pending":
      return "secondary"
    default:
      return "secondary"
  }
}

export function getResourceStatusVariant(
  status: string
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

export type InstanceDetailsData = InstanceDetails
