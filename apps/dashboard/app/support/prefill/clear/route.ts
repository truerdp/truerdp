import { NextResponse } from "next/server"

import { dashboardPaths } from "@/lib/paths"
import { SUPPORT_PREFILL_COOKIE } from "@/lib/support-prefill"

export async function POST() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: SUPPORT_PREFILL_COOKIE,
    value: "",
    maxAge: 0,
    path: dashboardPaths.supportNew,
  })

  return response
}
