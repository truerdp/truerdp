import { fetcher, type ApiRequestOptions } from "./fetcher"

declare const process: {
  env: Record<string, string | undefined>
}

const isServer = typeof window === "undefined"

interface CookieEntry {
  name: string
  value: string
}

interface CookieStore {
  getAll(): CookieEntry[]
}

interface NextHeadersModule {
  cookies(): CookieStore | Promise<CookieStore>
}

function getBaseUrl() {
  return isServer
    ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "")
    : (process.env.NEXT_PUBLIC_API_URL ?? "")
}

async function buildCookieHeader() {
  const nextHeadersModule = "next/headers" as string
  const { cookies } = (await import(nextHeadersModule)) as NextHeadersModule
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
