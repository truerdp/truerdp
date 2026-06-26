import { cookies } from "next/headers"

import { SupportPageClient } from "@/components/support-page/support-page-client"
import {
  decodeSupportTicketPrefill,
  SUPPORT_PREFILL_COOKIE,
} from "@/lib/support-prefill"

export default async function SupportPage() {
  const cookieStore = await cookies()
  const prefillCookie = cookieStore.get(SUPPORT_PREFILL_COOKIE)
  const prefill = prefillCookie
    ? decodeSupportTicketPrefill(prefillCookie.value)
    : null

  return <SupportPageClient prefill={prefill} />
}
