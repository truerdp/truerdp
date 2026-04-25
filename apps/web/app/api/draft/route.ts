import { draftMode } from "next/headers"
import { NextResponse } from "next/server"

function getDraftSecret() {
  return process.env.SANITY_DRAFT_SECRET?.trim()
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get("secret")
  const slug = url.searchParams.get("slug") ?? "/"
  const configuredSecret = getDraftSecret()

  if (!configuredSecret || secret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid draft token" }, { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()

  return NextResponse.redirect(new URL(slug, request.url))
}
