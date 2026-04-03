export const api = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem("token")

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error("API Error")
  }

  return res.json()
}
