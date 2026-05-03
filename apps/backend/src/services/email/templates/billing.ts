import { escapeHtml, getDashboardBaseUrl, sendManagedEmail } from "../core.js"

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

