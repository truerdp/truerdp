export const api = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem("token")
  const method = options?.method?.toUpperCase()
  const body = method === "POST" && options?.body == null ? "{}" : options?.body

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
    body,
  })

  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`

    try {
      const payload = (await res.json()) as {
        error?: string
        message?: string
      }

      if (typeof payload.error === "string" && payload.error.trim()) {
        errorMessage = payload.error.trim()
      } else if (
        typeof payload.message === "string" &&
        payload.message.trim()
      ) {
        errorMessage = payload.message.trim()
      }
    } catch {
      // Keep status-based fallback when error payload cannot be parsed.
    }

    throw new Error(errorMessage)
  }

  return res.json()
}
