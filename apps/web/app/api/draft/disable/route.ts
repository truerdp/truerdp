import { draftMode } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get("slug") ?? "/"
  const draft = await draftMode()
  draft.disable()

  return NextResponse.redirect(new URL(redirectTo, request.url))
}
