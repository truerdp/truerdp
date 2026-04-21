import { clientApi } from "@workspace/api"

export async function logout() {
  await clientApi("/auth/logout", {
    method: "POST",
  })
}

export function buildWebLoginUrl(redirectTarget: string) {
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
  const loginUrl = new URL("/login", webBaseUrl)
  loginUrl.searchParams.set("redirect", redirectTarget)
  return loginUrl.toString()
}
