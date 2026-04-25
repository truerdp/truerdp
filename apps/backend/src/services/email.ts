import { Resend } from "resend"
import { and, eq } from "drizzle-orm"
import { db } from "../db.js"
import { emailTemplates } from "../schema.js"

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

type SendEmailResult = {
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

function getDashboardBaseUrl() {
  return process.env.DASHBOARD_BASE_URL?.trim() || "http://localhost:3001"
}

function getAdminAlertRecipients() {
  return (process.env.ADMIN_ALERT_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

function escapeHtml(value: string) {
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

async function sendManagedEmail(input: {
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
      and(
        eq(emailTemplates.key, input.templateKey),
        eq(emailTemplates.isActive, true)
      )
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

export async function sendWelcomeEmail(input: {
  to: string
  firstName: string
}) {
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

export async function sendInvoiceCreatedEmail(input: {
  to: string
  firstName: string
  invoiceNumber: string
  invoiceId: number
  planName: string
  amount: string
  expiresAt: Date
}) {
  const invoiceUrl = new URL(
    `/invoices/${input.invoiceId}`,
    getDashboardBaseUrl()
  ).toString()
  const safeName = escapeHtml(input.firstName)
  const safeInvoiceNumber = escapeHtml(input.invoiceNumber)
  const safePlanName = escapeHtml(input.planName)
  const safeAmount = escapeHtml(input.amount)
  const safeInvoiceUrl = escapeHtml(invoiceUrl)
  const expiry = input.expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return sendManagedEmail({
    templateKey: "invoice_created",
    to: input.to,
    variables: {
      firstName: input.firstName,
      invoiceNumber: input.invoiceNumber,
      planName: input.planName,
      amount: input.amount,
      expiry,
      invoiceUrl,
    },
    fallbackSubject: `Invoice ${input.invoiceNumber} created`,
    fallbackText: `Hi ${input.firstName}, invoice ${input.invoiceNumber} for ${input.planName} is ready. Amount due: ${input.amount}. Pay before ${expiry}: ${invoiceUrl}`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Invoice created</h1>
        <p>Hi ${safeName}, your invoice <strong>${safeInvoiceNumber}</strong> for <strong>${safePlanName}</strong> is ready.</p>
        <p style="font-size: 18px; font-weight: 700;">Amount due: ${safeAmount}</p>
        <p style="font-size: 13px; color: #5d746b;">Payment window expires on ${escapeHtml(expiry)}.</p>
        <p>
          <a href="${safeInvoiceUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            View invoice
          </a>
        </p>
      </div>
    `,
    tags: [{ name: "category", value: "invoice_created" }],
  })
}

export async function sendPaymentConfirmedEmail(input: {
  to: string
  firstName: string
  invoiceNumber: string
  invoiceId: number
  transactionReference: string | null
  planName: string
  amount: string
  paidAt: Date
}) {
  const invoiceUrl = new URL(
    `/invoices/${input.invoiceId}`,
    getDashboardBaseUrl()
  ).toString()
  const safeName = escapeHtml(input.firstName)
  const safeInvoiceNumber = escapeHtml(input.invoiceNumber)
  const safePlanName = escapeHtml(input.planName)
  const safeAmount = escapeHtml(input.amount)
  const safeInvoiceUrl = escapeHtml(invoiceUrl)
  const paidAt = input.paidAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const referenceText = input.transactionReference
    ? ` Transaction: ${input.transactionReference}.`
    : ""

  return sendManagedEmail({
    templateKey: "payment_confirmed",
    to: input.to,
    variables: {
      firstName: input.firstName,
      invoiceNumber: input.invoiceNumber,
      planName: input.planName,
      amount: input.amount,
      transactionReference: input.transactionReference ?? "",
      paidAt,
      invoiceUrl,
    },
    fallbackSubject: `Payment confirmed for ${input.invoiceNumber}`,
    fallbackText: `Hi ${input.firstName}, we received your payment of ${input.amount} for ${input.planName}. Invoice: ${input.invoiceNumber}.${referenceText} Paid at ${paidAt}. ${invoiceUrl}`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Payment confirmed</h1>
        <p>Hi ${safeName}, we received your payment for <strong>${safePlanName}</strong>.</p>
        <p style="font-size: 18px; font-weight: 700;">Paid: ${safeAmount}</p>
        <p>Invoice <strong>${safeInvoiceNumber}</strong> is now marked as paid.</p>
        <p style="font-size: 13px; color: #5d746b;">Paid at ${escapeHtml(paidAt)}.</p>
        <p>
          <a href="${safeInvoiceUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            View receipt
          </a>
        </p>
      </div>
    `,
    tags: [{ name: "category", value: "payment_confirmed" }],
  })
}

export async function sendProvisionedEmail(input: {
  to: string
  firstName: string
  instanceId: number
  planName: string
  ipAddress: string
  username: string | null
}) {
  const instanceUrl = new URL(
    `/instances/${input.instanceId}`,
    getDashboardBaseUrl()
  ).toString()
  const safeName = escapeHtml(input.firstName)
  const safePlanName = escapeHtml(input.planName)
  const safeIp = escapeHtml(input.ipAddress)
  const safeUser = escapeHtml(input.username ?? "Not set")
  const safeUrl = escapeHtml(instanceUrl)

  return sendManagedEmail({
    templateKey: "instance_provisioned",
    to: input.to,
    variables: {
      firstName: input.firstName,
      instanceId: String(input.instanceId),
      planName: input.planName,
      ipAddress: input.ipAddress,
      username: input.username ?? "",
      instanceUrl,
    },
    fallbackSubject: `Instance #${input.instanceId} is ready`,
    fallbackText: `Hi ${input.firstName}, your ${input.planName} instance is ready. IP: ${input.ipAddress}. Username: ${input.username ?? "Not set"}. View: ${instanceUrl}`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Your instance is ready</h1>
        <p>Hi ${safeName}, your <strong>${safePlanName}</strong> instance is now provisioned.</p>
        <p><strong>IP:</strong> ${safeIp}<br /><strong>Username:</strong> ${safeUser}</p>
        <p>
          <a href="${safeUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            Open instance details
          </a>
        </p>
      </div>
    `,
    tags: [{ name: "category", value: "instance_provisioned" }],
  })
}

export async function sendPaymentFailedEmail(input: {
  to: string
  firstName: string
  invoiceNumber: string
  invoiceId: number
  planName: string
  amount: string
  reason: string
}) {
  const invoiceUrl = new URL(
    `/invoices/${input.invoiceId}`,
    getDashboardBaseUrl()
  ).toString()
  const safeName = escapeHtml(input.firstName)
  const safeReason = escapeHtml(input.reason)
  const safeInvoice = escapeHtml(input.invoiceNumber)
  const safePlanName = escapeHtml(input.planName)
  const safeAmount = escapeHtml(input.amount)
  const safeInvoiceUrl = escapeHtml(invoiceUrl)

  return sendManagedEmail({
    templateKey: "payment_failed",
    to: input.to,
    variables: {
      firstName: input.firstName,
      invoiceNumber: input.invoiceNumber,
      planName: input.planName,
      amount: input.amount,
      reason: input.reason,
      invoiceUrl,
    },
    fallbackSubject: `Payment failed for ${input.invoiceNumber}`,
    fallbackText: `Hi ${input.firstName}, payment failed for invoice ${input.invoiceNumber} (${input.planName}, ${input.amount}). Reason: ${input.reason}. Retry payment: ${invoiceUrl}`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Payment failed</h1>
        <p>Hi ${safeName}, payment for invoice <strong>${safeInvoice}</strong> could not be completed.</p>
        <p><strong>Plan:</strong> ${safePlanName}<br /><strong>Amount:</strong> ${safeAmount}</p>
        <p style="font-size: 13px; color: #5d746b;">Reason: ${safeReason}</p>
        <p>
          <a href="${safeInvoiceUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            Retry payment
          </a>
        </p>
      </div>
    `,
    tags: [{ name: "category", value: "payment_failed" }],
  })
}

export async function sendExpiryReminderEmail(input: {
  to: string
  firstName: string
  instanceId: number
  planName: string
  expiryDate: Date
  daysRemaining: number
}) {
  const instanceUrl = new URL(
    `/instances/${input.instanceId}`,
    getDashboardBaseUrl()
  ).toString()
  const expiry = input.expiryDate.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const safeName = escapeHtml(input.firstName)
  const safePlanName = escapeHtml(input.planName)
  const safeExpiry = escapeHtml(expiry)
  const safeInstanceUrl = escapeHtml(instanceUrl)

  return sendManagedEmail({
    templateKey: "expiry_reminder",
    to: input.to,
    variables: {
      firstName: input.firstName,
      instanceId: String(input.instanceId),
      planName: input.planName,
      expiryDate: expiry,
      daysRemaining: String(input.daysRemaining),
      instanceUrl,
    },
    fallbackSubject: `Instance #${input.instanceId} expires in ${input.daysRemaining} day(s)`,
    fallbackText: `Hi ${input.firstName}, your ${input.planName} instance #${input.instanceId} expires on ${expiry}. Renew from: ${instanceUrl}`,
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; color: #10231b; line-height: 1.6;">
        <h1 style="font-size: 22px;">Expiry reminder</h1>
        <p>Hi ${safeName}, your <strong>${safePlanName}</strong> instance #${input.instanceId} is nearing expiry.</p>
        <p style="font-size: 13px; color: #5d746b;">Expiry date: ${safeExpiry}</p>
        <p>
          <a href="${safeInstanceUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f6b4f; color: #ffffff; text-decoration: none; font-weight: 700;">
            Review instance
          </a>
        </p>
      </div>
    `,
    tags: [{ name: "category", value: "expiry_reminder" }],
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
