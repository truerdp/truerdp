"use client"

import { clientApi } from "@workspace/api/client"

type SupportImageUploadResponse = {
  image: {
    url: string
    alt: string
  }
}

export async function uploadSupportImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await clientApi<SupportImageUploadResponse>(
    "/support/uploads/images",
    {
      method: "POST",
      body: formData,
    }
  )

  return response.image
}
