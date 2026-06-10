import {
  buildBrandedEmailHtml,
  escapeHtml,
  getDashboardBaseUrl,
  getWebBaseUrl,
  sendManagedEmail,
} from "../core.js"

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
  const expiry = input.expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const safeExpiry = escapeHtml(expiry)
  const detailsHtml = `
    <p style="margin: 0; font-size: 15px; color: #10231b;">Hi ${safeName}, your invoice <strong>${safeInvoiceNumber}</strong> for <strong>${safePlanName}</strong> is ready.</p>
    <div style="margin: 22px auto 0; border-radius: 16px; background: #f5f8f7; padding: 18px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #5d746b;">Amount due</p>
      <p style="margin: 6px 0 0; font-size: 24px; font-weight: 800; color: #10231b;">${safeAmount}</p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #5d746b;">Payment window expires on ${safeExpiry}.</p>
    </div>
  `

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
      logoUrl: `${getWebBaseUrl()}/favicon-96x96.png`,
    },
    fallbackSubject: `Invoice ${input.invoiceNumber} created`,
    fallbackText: `Hi ${input.firstName}, invoice ${input.invoiceNumber} for ${input.planName} is ready. Amount due: ${input.amount}. Pay before ${expiry}: ${invoiceUrl}`,
    fallbackHtml: buildBrandedEmailHtml({
      title: "Invoice created",
      intro: "Your invoice is ready and waiting in your dashboard.",
      bodyHtml: detailsHtml,
      buttonHref: invoiceUrl,
      buttonLabel: "View invoice",
      directLinkLabel:
        "If the button does not work, click this link directly:",
      footer: "You can pay this invoice from your dashboard.",
    }),
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
  const paidAt = input.paidAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const referenceText = input.transactionReference
    ? ` Transaction: ${input.transactionReference}.`
    : ""
  const safePaidAt = escapeHtml(paidAt)
  const safeReference = input.transactionReference
    ? escapeHtml(input.transactionReference)
    : "-"
  const receiptHtml = `
    <p style="margin: 0; font-size: 15px; color: #10231b;">Hi ${safeName}, we received your payment for <strong>${safePlanName}</strong>.</p>
    <div style="margin: 22px auto 0; border-radius: 16px; background: #f5f8f7; padding: 18px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #5d746b;">Paid</p>
      <p style="margin: 6px 0 0; font-size: 24px; font-weight: 800; color: #10231b;">${safeAmount}</p>
      <p style="margin: 12px 0 0; font-size: 14px; color: #10231b;">Invoice <strong>${safeInvoiceNumber}</strong> is marked as paid.</p>
      <p style="margin: 8px 0 0; font-size: 13px; color: #5d746b;">Transaction: ${safeReference}</p>
      <p style="margin: 8px 0 0; font-size: 13px; color: #5d746b;">Paid at ${safePaidAt}.</p>
    </div>
  `

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
      logoUrl: `${getWebBaseUrl()}/favicon-96x96.png`,
    },
    fallbackSubject: `Payment confirmed for ${input.invoiceNumber}`,
    fallbackText: `Hi ${input.firstName}, we received your payment of ${input.amount} for ${input.planName}. Invoice: ${input.invoiceNumber}.${referenceText} Paid at ${paidAt}. ${invoiceUrl}`,
    fallbackHtml: buildBrandedEmailHtml({
      title: "Payment confirmed",
      intro: "Your payment was received and your invoice has been updated.",
      bodyHtml: receiptHtml,
      buttonHref: invoiceUrl,
      buttonLabel: "View receipt",
      directLinkLabel:
        "If the button does not work, click this link directly:",
      footer: "Provisioning will continue from your dashboard order status.",
    }),
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

