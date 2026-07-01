import { cookies } from "next/headers"

import { CreateTicketForm } from "@/components/support-page/create-ticket-form"
import {
  decodeSupportTicketPrefill,
  SUPPORT_PREFILL_COOKIE,
} from "@/lib/support-prefill"

export default async function NewSupportTicketPage() {
  const cookieStore = await cookies()
  const prefillCookie = cookieStore.get(SUPPORT_PREFILL_COOKIE)
  const prefill = prefillCookie
    ? decodeSupportTicketPrefill(prefillCookie.value)
    : null

  return (
    <section className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create new ticket</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send your request to the TrueRDP support team.
        </p>
      </div>
      <CreateTicketForm
        initialSubject={prefill?.subject}
        initialMessage={prefill?.message}
      />
    </section>
  )
}
