export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  baseUrl?: string
}

const METHODS_WITH_DEFAULT_JSON_BODY = new Set(["POST", "PUT", "PATCH"])

function hasArrayBufferSupport(value: unknown) {
  return (
    typeof ArrayBuffer !== "undefined" &&
    (value instanceof ArrayBuffer || ArrayBuffer.isView(value))
  )
}

function isReadableStream(value: unknown) {
  return (
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream
  )
}

function isJsonBody(value: unknown, isFormData: boolean) {
  if (value == null || isFormData) {
    return false
  }

  if (typeof value === "string") {
    return false
  }

  if (
    typeof URLSearchParams !== "undefined" &&
    value instanceof URLSearchParams
  ) {
    return false
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return false
  }

  if (hasArrayBufferSupport(value) || isReadableStream(value)) {
    return false
  }

  return true
}

async function parseErrorMessage(res: Response) {
  let errorMessage = `Request failed (${res.status})`

  try {
    const payload = (await res.json()) as {
      error?: string
      message?: string
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      errorMessage = payload.error.trim()
    } else if (typeof payload.message === "string" && payload.message.trim()) {
      errorMessage = payload.message.trim()
    }
  } catch {
    try {
      const text = await res.text()
      if (text.trim()) {
        errorMessage = text.trim()
      }
    } catch {
      // Keep status-based fallback when error payload cannot be parsed.
    }
  }

  return errorMessage
}

export async function fetcher<T = unknown>(
  url: string,
  options?: ApiRequestOptions
): Promise<T> {
  const method = options?.method?.toUpperCase() ?? "GET"
  const headers = new Headers(options?.headers)
  const baseUrl = options?.baseUrl ?? ""
  const { baseUrl: _, ...requestOptions } = options ?? {}

  let body = requestOptions.body

  if (body == null && METHODS_WITH_DEFAULT_JSON_BODY.has(method)) {
    body = {}
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  const shouldSerializeJson = isJsonBody(body, isFormData)

  if (shouldSerializeJson) {
    body = JSON.stringify(body)
  }

  if (shouldSerializeJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  headers.set("X-Requested-With", "XMLHttpRequest")

  const res = await fetch(`${baseUrl}${url}`, {
    ...requestOptions,
    method,
    credentials: "include",
    headers,
    body: body as BodyInit | null | undefined,
  })

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res))
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()

  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}
