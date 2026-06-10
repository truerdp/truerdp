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

export function getWebBaseUrl() {
  return (process.env.WEB_BASE_URL?.trim() || "http://localhost:3000").replace(
    /\/$/,
    ""
  )
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

export function buildBrandedEmailHtml(input: {
  title: string
  intro: string
  bodyHtml: string
  buttonHref?: string
  buttonLabel?: string
  directLinkLabel?: string
  footer?: string
}) {
  const logoUrl = `${getWebBaseUrl()}/favicon-96x96.png`
  const safeLogoUrl = escapeHtml(logoUrl)
  const safeTitle = escapeHtml(input.title)
  const safeIntro = escapeHtml(input.intro)
  const safeButtonHref = input.buttonHref ? escapeHtml(input.buttonHref) : ""
  const safeButtonLabel = input.buttonLabel
    ? escapeHtml(input.buttonLabel)
    : ""
  const safeDirectLinkLabel = escapeHtml(
    input.directLinkLabel ?? "If the button does not work, click this link directly:"
  )
  const safeFooter = input.footer ? escapeHtml(input.footer) : ""

  return `
    <div style="margin: 0; padding: 32px 18px; background: #f5f8f7; font-family: Arial, sans-serif; color: #10231b; line-height: 1.6; text-align: center;">
      <div style="margin: 0 auto; max-width: 540px; border-radius: 24px; background: #ffffff; padding: 34px 28px; box-shadow: 0 16px 40px rgba(16, 35, 27, 0.08); text-align: center;">
        <img src="${safeLogoUrl}" width="64" height="64" alt="TrueRDP logo" style="display: block; margin: 0 auto 14px; border: 0; outline: none; text-decoration: none;" />
        <div style="margin-bottom: 24px; font-size: 22px; font-weight: 800; letter-spacing: 0.02em; color: #10231b;">TrueRDP</div>
        <h1 style="margin: 0; font-size: 26px; line-height: 1.25; color: #10231b;">${safeTitle}</h1>
        <p style="margin: 14px auto 0; max-width: 420px; font-size: 15px; color: #4f675d;">${safeIntro}</p>
        <div style="margin: 26px auto 0; max-width: 440px; text-align: center;">${input.bodyHtml}</div>
        ${
          safeButtonHref && safeButtonLabel
            ? `
              <p style="margin: 28px 0 0;">
                <a href="${safeButtonHref}" style="display: inline-block; padding: 13px 24px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
                  ${safeButtonLabel}
                </a>
              </p>
              <p style="margin: 26px auto 0; max-width: 420px; font-size: 13px; color: #5d746b;">${safeDirectLinkLabel}</p>
              <p style="margin: 8px auto 0; max-width: 420px; font-size: 13px; line-height: 1.5; word-break: break-all;">
                <a href="${safeButtonHref}" style="color: #0f6b4f; text-decoration: underline;">${safeButtonHref}</a>
              </p>
            `
            : ""
        }
        ${
          safeFooter
            ? `<p style="margin: 24px auto 0; max-width: 390px; font-size: 12px; color: #7b8d86;">${safeFooter}</p>`
            : ""
        }
      </div>
    </div>
  `
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
