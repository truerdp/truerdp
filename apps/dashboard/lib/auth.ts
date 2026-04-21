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

export function buildWebCheckoutUrl(orderId: number) {
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
  return new URL(`/checkout/${orderId}`, webBaseUrl).toString()
}

export function buildWebCheckoutReviewUrl(orderId: number) {
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
  return new URL(`/checkout/${orderId}/review`, webBaseUrl).toString()
}
