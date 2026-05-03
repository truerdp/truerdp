import { escapeHtml, getAdminAlertRecipients, sendManagedEmail } from "../core.js"

export async function sendPasswordResetEmail(input: {
  to: string
  resetUrl: string
}) {
  return sendManagedEmail({
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
}

export async function sendVerificationEmail(input: {
  to: string
  verificationUrl: string
}) {
  return sendManagedEmail({
    templateKey: "email_verification",
    to: input.to,
    variables: {
      verificationUrl: input.verificationUrl,
    },
    fallbackSubject: "Verify your TrueRDP email",
    fallbackText: `Verify your email: ${input.verificationUrl}\n\nIf you did not create this account, you can ignore this email.`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Verify your email</h1>
        <p>Please confirm your email address to activate your TrueRDP account.</p>
        <p>
          <a href="${escapeHtml(input.verificationUrl)}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            Verify email
          </a>
        </p>
      </div>
    `,
    tags: [{ name: "category", value: "email_verification" }],
  })
}

export async function sendWelcomeEmail(input: { to: string; firstName: string }) {
  const safeName = escapeHtml(input.firstName)

  return sendManagedEmail({
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
