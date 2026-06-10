import {
  escapeHtml,
  getAdminAlertRecipients,
  sendManagedEmail,
} from "../core.js"

function assertEmailSent(
  result: Awaited<ReturnType<typeof sendManagedEmail>>,
  purpose: string
) {
  if (result.sent) {
    return result
  }

  throw new Error(
    `${purpose} email was not sent: ${result.skippedReason ?? "unknown reason"}`
  )
}

function getWebBaseUrl() {
  return (process.env.WEB_BASE_URL?.trim() || "http://localhost:3000").replace(
    /\/$/,
    ""
  )
}

export async function sendPasswordResetEmail(input: {
  to: string
  resetUrl: string
}) {
  const result = await sendManagedEmail({
    templateKey: "password_reset",
    to: input.to,
    variables: {
      resetUrl: input.resetUrl,
    },
    fallbackSubject: "Reset your TrueRDP password",
    fallbackText: `Reset your TrueRDP password: ${input.resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Reset your password</h1>
        <p>We received a request to reset your TrueRDP password.</p>
        <p>
          <a href="${escapeHtml(input.resetUrl)}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            Reset password
          </a>
        </p>
        <p style="font-size: 13px; color: #5d746b;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      </div>
    `,
    tags: [{ name: "category", value: "password_reset" }],
  })

  return assertEmailSent(result, "Password reset")
}

export async function sendVerificationEmail(input: {
  to: string
  verificationUrl: string
}) {
  const safeVerificationUrl = escapeHtml(input.verificationUrl)
  const logoUrl = `${getWebBaseUrl()}/favicon-96x96.png`
  const safeLogoUrl = escapeHtml(logoUrl)

  const result = await sendManagedEmail({
    templateKey: "email_verification",
    to: input.to,
    variables: {
      verificationUrl: input.verificationUrl,
      logoUrl,
    },
    fallbackSubject: "Verify your TrueRDP email",
    fallbackText: `Verify your TrueRDP email: ${input.verificationUrl}\n\nIf the button does not work, open this link directly:\n${input.verificationUrl}\n\nIf you did not create this account, you can ignore this email.`,
    fallbackHtml: `
      <div style="margin: 0; padding: 32px 18px; background: #f5f8f7; font-family: Arial, sans-serif; color: #10231b; line-height: 1.6; text-align: center;">
        <div style="margin: 0 auto; max-width: 520px; border-radius: 24px; background: #ffffff; padding: 34px 28px; box-shadow: 0 16px 40px rgba(16, 35, 27, 0.08); text-align: center;">
          <img src="${safeLogoUrl}" width="64" height="64" alt="TrueRDP logo" style="display: block; margin: 0 auto 14px; border: 0; outline: none; text-decoration: none;" />
          <div style="margin-bottom: 24px; font-size: 22px; font-weight: 800; letter-spacing: 0.02em; color: #10231b;">TrueRDP</div>
          <h1 style="margin: 0; font-size: 26px; line-height: 1.25; color: #10231b;">Verify your email</h1>
          <p style="margin: 14px auto 0; max-width: 390px; font-size: 15px; color: #4f675d;">Please confirm your email address to activate your TrueRDP account.</p>
          <p style="margin: 28px 0 0;">
            <a href="${safeVerificationUrl}" style="display: inline-block; padding: 13px 24px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
              Verify email
            </a>
          </p>
          <p style="margin: 26px auto 0; max-width: 420px; font-size: 13px; color: #5d746b;">If the button does not work, click this link directly:</p>
          <p style="margin: 8px auto 0; max-width: 420px; font-size: 13px; line-height: 1.5; word-break: break-all;">
            <a href="${safeVerificationUrl}" style="color: #0f6b4f; text-decoration: underline;">${safeVerificationUrl}</a>
          </p>
          <p style="margin: 24px auto 0; max-width: 390px; font-size: 12px; color: #7b8d86;">If you did not create this account, you can ignore this email.</p>
        </div>
      </div>
    `,
    tags: [{ name: "category", value: "email_verification" }],
  })

  return assertEmailSent(result, "Verification")
}

export async function sendWelcomeEmail(input: {
  to: string
  firstName: string
}) {
  const safeName = escapeHtml(input.firstName)

  const result = await sendManagedEmail({
    templateKey: "welcome",
    to: input.to,
    variables: {
      firstName: input.firstName,
    },
    fallbackSubject: "Welcome to TrueRDP",
    fallbackText: `Welcome to TrueRDP, ${input.firstName}. Your account is ready.`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Welcome to TrueRDP</h1>
        <p>Hi ${safeName}, your account is ready.</p>
        <p>You can now browse plans, complete checkout, and manage your RDP instances from the dashboard.</p>
      </div>
    `,
    tags: [{ name: "category", value: "welcome" }],
  })

  return assertEmailSent(result, "Welcome")
}

export async function sendAdminAlertEmail(input: {
  subject: string
  text: string
  html?: string
}) {
  const recipients = getAdminAlertRecipients()

  if (recipients.length === 0) {
    return {
      sent: false,
      skippedReason: "ADMIN_ALERT_EMAILS is not configured",
    }
  }

  return sendManagedEmail({
    templateKey: "admin_alert",
    to: recipients,
    variables: {
      subject: input.subject,
      text: input.text,
      html: input.html ?? "",
    },
    fallbackSubject: input.subject,
    fallbackText: input.text,
    fallbackHtml:
      input.html ??
      `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(input.text)}</pre>`,
    tags: [{ name: "category", value: "admin_alert" }],
  })
}
