import { draftMode } from "next/headers"
import { NextResponse } from "next/server"

function getDraftSecret() {
  return process.env.CMS_REVALIDATE_SECRET?.trim()
}

function getSafeRedirectPath(request: Request, fallback: string) {
  const url = new URL(request.url)
  const redirectPath = url.searchParams.get("slug") ?? fallback
  const redirectUrl = new URL(redirectPath, url.origin)

  if (redirectUrl.origin !== url.origin) {
    return fallback
  }

  return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get("secret")
  const redirectPath = getSafeRedirectPath(request, "/")
  const configuredSecret = getDraftSecret()

  if (!configuredSecret || secret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid draft token" }, { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()

  return NextResponse.redirect(new URL(redirectPath, url.origin))
}
