import { fetcher, type ApiRequestOptions } from "./fetcher"
import { cookies } from "next/headers"

declare const process: {
  env: Record<string, string | undefined>
}

const isServer = typeof window === "undefined"

function firstConfiguredUrl(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean) ?? ""
}

function getBaseUrl() {
  return isServer
    ? firstConfiguredUrl(
        process.env.INTERNAL_API_URL,
        process.env.API_BASE_URL,
        process.env.BACKEND_BASE_URL,
        process.env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_API_URL
      )
    : firstConfiguredUrl(process.env.NEXT_PUBLIC_API_URL)
}

async function buildCookieHeader() {
  const cookieStore = await cookies()

  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
}

export async function serverApi<T = unknown>(
  url: string,
  options?: ApiRequestOptions
) {
  const headers = new Headers(options?.headers)
  const cookieHeader = await buildCookieHeader()

  if (cookieHeader) {
    headers.set("cookie", cookieHeader)
  }

  return fetcher<T>(url, {
    ...options,
    headers,
    baseUrl: getBaseUrl(),
  })
}
