import type { AuthUser } from "../types/auth.js"

export const customerPermissions = {
  viewAs: "customer.view_as",
  impersonate: "customer.impersonate",
} as const

export type CustomerPermission =
  (typeof customerPermissions)[keyof typeof customerPermissions]

export function userHasPermission(
  user: AuthUser | undefined,
  permission: CustomerPermission
) {
  if (!user) {
    return false
  }

  if (user.role !== "admin") {
    return false
  }

  return (
    permission === customerPermissions.viewAs ||
    permission === customerPermissions.impersonate
  )
}
