import { Resend } from "resend"

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

type ManagedEmailTemplate = {
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string | null
}

export type SendEmailResult = {
  sent: boolean
  id?: string | null
  skippedReason?: string
}

function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() ?? ""
}

function getResendBaseUrl() {
  return process.env.RESEND_BASE_URL?.trim().replace(/\/$/, "") ?? ""
}

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || "TrueRDP <onboarding@resend.dev>"
  )
}

function getReplyToEmail() {
  return process.env.RESEND_REPLY_TO_EMAIL?.trim() || undefined
}

function getCmsInternalApiUrl() {
  return process.env.CMS_INTERNAL_API_URL?.trim().replace(/\/$/, "") ?? ""
}

function getCmsInternalApiToken() {
  return process.env.CMS_INTERNAL_API_TOKEN?.trim() ?? ""
}

export function getDashboardBaseUrl() {
  return process.env.DASHBOARD_BASE_URL?.trim() || "http://localhost:3001"
}

export function getAdminAlertRecipients() {
  return (process.env.ADMIN_ALERT_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function interpolateTemplate(
  template: string,
  variables: Record<string, string>
) {
  return template.replaceAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return variables[key] ?? ""
  })
}

async function getManagedEmailTemplate(key: string) {
  const baseUrl = getCmsInternalApiUrl()
  const token = getCmsInternalApiToken()

  if (!baseUrl || !token) {
    return null
  }

  try {
    const response = await fetch(
      `${baseUrl}/internal/email-templates/${encodeURIComponent(key)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      template?: ManagedEmailTemplate | null
    }

    return payload.template ?? null
  } catch (error) {
    console.warn("[email] failed to load Payload email template", error)
    return null
  }
}

export async function sendManagedEmail(input: {
  templateKey: string
  to: string | string[]
  variables: Record<string, string>
  fallbackSubject: string
  fallbackHtml: string
  fallbackText?: string
  tags?: { name: string; value: string }[]
}) {
  const template = await getManagedEmailTemplate(input.templateKey)
  const subjectTemplate = template?.subjectTemplate ?? input.fallbackSubject
  const htmlTemplate = template?.htmlTemplate ?? input.fallbackHtml
  const textTemplate = template?.textTemplate ?? input.fallbackText

  return sendEmail({
    to: input.to,
    subject: interpolateTemplate(subjectTemplate, input.variables),
    html: interpolateTemplate(htmlTemplate, input.variables),
    text:
      typeof textTemplate === "string"
        ? interpolateTemplate(textTemplate, input.variables)
        : undefined,
    tags: input.tags,
  })
}

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const apiKey = getResendApiKey()

  if (!apiKey) {
    console.warn("[email] skipped: RESEND_API_KEY is not configured")
    return {
      sent: false,
      skippedReason: "RESEND_API_KEY is not configured",
    }
  }

  const baseUrl = getResendBaseUrl()

  if (baseUrl) {
    const response = await fetch(`${baseUrl}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo ?? getReplyToEmail(),
        tags: input.tags,
      }),
    })

    const payload = (await response.json().catch(() => null)) as {
      id?: string | null
      message?: string
      error?: string
    } | null

    if (!response.ok) {
      throw new Error(
        payload?.message ||
          payload?.error ||
          `Resend email request failed (${response.status})`
      )
    }

    return {
      sent: true,
      id: payload?.id ?? null,
    }
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo ?? getReplyToEmail(),
    tags: input.tags,
  })

  if (error) {
    throw new Error(error.message || "Resend email request failed")
  }

  return {
    sent: true,
    id: data?.id ?? null,
  }
}
