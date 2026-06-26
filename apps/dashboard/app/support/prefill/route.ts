import { NextRequest, NextResponse } from "next/server"

import { dashboardPaths } from "@/lib/paths"
import {
  encodeSupportTicketPrefill,
  SUPPORT_PREFILL_COOKIE,
  SUPPORT_PREFILL_MAX_AGE_SECONDS,
} from "@/lib/support-prefill"

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL(dashboardPaths.support, request.url),
    303
  )

  if (!isAllowedPrefillOrigin(request)) {
    clearPrefillCookie(response)
    return response
  }

  const formData = await request.formData()
  const encodedPrefill = encodeSupportTicketPrefill({
    subject: getFormValue(formData, "subject"),
    message: getFormValue(formData, "message"),
  })

  if (!encodedPrefill) {
    clearPrefillCookie(response)
    return response
  }

  response.cookies.set({
    name: SUPPORT_PREFILL_COOKIE,
    value: encodedPrefill,
    httpOnly: true,
    maxAge: SUPPORT_PREFILL_MAX_AGE_SECONDS,
    path: dashboardPaths.support,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name)

  return typeof value === "string" ? value : ""
}

function isAllowedPrefillOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!origin) {
    return true
  }

  const dashboardOrigin = new URL(request.url).origin
  const webOrigin = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
  const allowedOrigins = new Set([dashboardOrigin, new URL(webOrigin).origin])

  return allowedOrigins.has(origin)
}

function clearPrefillCookie(response: NextResponse) {
  response.cookies.set({
    name: SUPPORT_PREFILL_COOKIE,
    value: "",
    maxAge: 0,
    path: dashboardPaths.support,
  })
}
