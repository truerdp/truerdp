export type SupportTicketPrefill = {
  subject: string
  message: string
}

export const SUPPORT_PREFILL_COOKIE = "support-ticket-prefill"
export const SUPPORT_PREFILL_MAX_AGE_SECONDS = 10 * 60

const MAX_SUBJECT_LENGTH = 160
const MAX_MESSAGE_LENGTH = 4000

export function normalizeSupportTicketPrefill(
  prefill: SupportTicketPrefill
): SupportTicketPrefill | null {
  const subject = prefill.subject.trim().slice(0, MAX_SUBJECT_LENGTH)
  const message = prefill.message.trim().slice(0, MAX_MESSAGE_LENGTH)

  if (!subject && !message) {
    return null
  }

  return { subject, message }
}

export function encodeSupportTicketPrefill(prefill: SupportTicketPrefill) {
  const normalized = normalizeSupportTicketPrefill(prefill)

  if (!normalized) {
    return null
  }

  return Buffer.from(JSON.stringify(normalized), "utf8").toString("base64url")
}

export function decodeSupportTicketPrefill(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    const parsed = JSON.parse(decoded) as Partial<SupportTicketPrefill>

    if (
      typeof parsed.subject !== "string" ||
      typeof parsed.message !== "string"
    ) {
      return null
    }

    return normalizeSupportTicketPrefill({
      subject: parsed.subject,
      message: parsed.message,
    })
  } catch {
    return null
  }
}
