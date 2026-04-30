import { draftMode } from "next/headers"
import { NextResponse } from "next/server"
import { validatePreviewUrl } from "@sanity/preview-url-secret"

import { sanityClient } from "@/lib/sanity"

function getDraftSecret() {
  return process.env.SANITY_DRAFT_SECRET?.trim()
}

function getSafeRedirectPath(request: Request, fallback: string) {
  const url = new URL(request.url)
  const redirectPath =
    url.searchParams.get("sanity-preview-pathname") ??
    url.searchParams.get("slug") ??
    fallback
  const redirectUrl = new URL(redirectPath, url.origin)

  if (redirectUrl.origin !== url.origin) {
    return fallback
  }

  return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
}

async function validateSanityPresentationUrl(request: Request) {
  const client = sanityClient.withConfig({
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })

  return validatePreviewUrl(client, request.url)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get("secret")
  const previewSecret = url.searchParams.get("sanity-preview-secret")
  const redirectPath = getSafeRedirectPath(request, "/")
  const configuredSecret = getDraftSecret()

  if (previewSecret) {
    const validation = await validateSanityPresentationUrl(request)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid Sanity preview token" },
        { status: 401 }
      )
    }

    const draft = await draftMode()
    draft.enable()

    return NextResponse.redirect(
      new URL(validation.redirectTo ?? redirectPath, url.origin)
    )
  }

  if (!configuredSecret || secret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid draft token" }, { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()

  return NextResponse.redirect(new URL(redirectPath, url.origin))
}
