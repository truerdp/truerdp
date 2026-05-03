import { adminPaths } from "@/lib/paths"
import type { UserDetailsData, UserInstance } from "./types"
import { formatMethod } from "./formatters"

export function getInstanceServerLabel(instance: UserInstance) {
  const provider = instance.server?.provider || "Unassigned"
  const ip = instance.server?.ipAddress || "-"
  const username = instance.resource?.username
  return `${ip} • ${provider}${username ? ` • ${username}` : ""}`
}

export function getInstancePlanLabel(instance: UserInstance) {
  if (!instance.plan) {
    return "Plan unavailable"
  }
  return `${instance.plan.name} • ${instance.plan.cpu} CPU • ${instance.plan.ram} GB RAM • ${instance.plan.storage} GB`
}

export function getInstanceExpiryLabel(instance: UserInstance) {
  if (instance.daysUntilExpiry != null && instance.daysUntilExpiry >= 0) {
    return `${instance.daysUntilExpiry} day${
      instance.daysUntilExpiry === 1 ? "" : "s"
    } remaining`
  }

  if (instance.daysSinceExpiry != null && instance.daysSinceExpiry > 0) {
    return `${instance.daysSinceExpiry} day${
      instance.daysSinceExpiry === 1 ? "" : "s"
    } overdue`
  }

  return "-"
}

export function getInstanceExtensionsLabel(instance: UserInstance) {
  if (instance.extensionCount <= 0) {
    return "None"
  }

  return `${instance.extensionCount} total${
    instance.lastExtensionDays ? ` • last +${instance.lastExtensionDays}d` : ""
  }`
}

export function getInstanceQuickMeta(instance: UserInstance) {
  return `${instance.plan?.name || "Plan unavailable"} • ${
    instance.server?.ipAddress || "No IP yet"
  }`
}

export function getBillingAddress(
  details: UserDetailsData["latestBillingDetails"] | null
) {
  if (!details) {
    return "-"
  }

  return [
    details.addressLine1,
    details.addressLine2,
    details.city,
    details.state,
    details.postalCode,
    details.country,
  ]
    .filter(Boolean)
    .join(", ")
}

export function getPreferredMethods(transactions: UserDetailsData["transactions"]) {
  return (
    Array.from(
      new Set(transactions.map((transaction) => formatMethod(transaction.method)))
    ).join(", ") || "-"
  )
}

export function getActiveInstanceLinks(instances: UserDetailsData["instances"]) {
  return instances
    .filter((instance) => instance.status === "active")
    .slice(0, 5)
    .map((instance) => ({
      id: instance.id,
      href: adminPaths.instanceDetails(instance.id),
      label: getInstanceQuickMeta(instance),
    }))
}
