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
    throw new Error("API Error")
  }

  return res.json()
}
