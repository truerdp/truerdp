import { fetcher, type ApiRequestOptions } from "./fetcher"
import { cookies } from "next/headers"

declare const process: {
  env: Record<string, string | undefined>
}

const isServer = typeof window === "undefined"

function getBaseUrl() {
  return isServer
    ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "")
    : (process.env.NEXT_PUBLIC_API_URL ?? "")
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
