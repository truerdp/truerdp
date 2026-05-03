import { and, eq } from "drizzle-orm"
import { Resend } from "resend"
import { db } from "../../db.js"
import { emailTemplates } from "../../schema.js"

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export type SendEmailResult = {
  sent: boolean
  id?: string | null
  skippedReason?: string
}

function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() ?? ""
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "TrueRDP <onboarding@resend.dev>"
}

function getReplyToEmail() {
  return process.env.RESEND_REPLY_TO_EMAIL?.trim() || undefined
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

function interpolateTemplate(template: string, variables: Record<string, string>) {
  return template.replaceAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return variables[key] ?? ""
  })
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
  const [template] = await db
    .select({
      subjectTemplate: emailTemplates.subjectTemplate,
      htmlTemplate: emailTemplates.htmlTemplate,
      textTemplate: emailTemplates.textTemplate,
    })
    .from(emailTemplates)
    .where(
      and(eq(emailTemplates.key, input.templateKey), eq(emailTemplates.isActive, true))
    )
    .limit(1)

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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = getResendApiKey()

  if (!apiKey) {
    return {
      sent: false,
      skippedReason: "RESEND_API_KEY is not configured",
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

