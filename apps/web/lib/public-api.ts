import "server-only"

import { fetcher, type ApiRequestOptions } from "@workspace/api/fetcher"

function getPublicApiBaseUrl() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ""
}

export function publicApi<T = unknown>(
  url: string,
  options?: ApiRequestOptions
) {
  return fetcher<T>(url, {
    ...options,
    baseUrl: getPublicApiBaseUrl(),
  })
}
