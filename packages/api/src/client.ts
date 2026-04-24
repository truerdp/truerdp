import { fetcher, type ApiRequestOptions } from "./fetcher"

declare const process: {
  env: Record<string, string | undefined>
}

const isServer = typeof window === "undefined"

function getBaseUrl() {
  return isServer
    ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "")
    : (process.env.NEXT_PUBLIC_API_URL ??
        (process.env.NODE_ENV === "development" ? "http://localhost:3003" : ""))
}

export function clientApi<T = unknown>(
  url: string,
  options?: ApiRequestOptions
) {
  return fetcher<T>(url, {
    ...options,
    baseUrl: getBaseUrl(),
  })
}
