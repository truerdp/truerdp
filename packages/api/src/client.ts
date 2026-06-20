import { fetcher, type ApiRequestOptions } from "./fetcher"

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
    : firstConfiguredUrl(
        process.env.NEXT_PUBLIC_API_URL,
        process.env.NODE_ENV === "development"
          ? "http://localhost:3003"
          : undefined
      )
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
