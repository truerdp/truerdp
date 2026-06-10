import {
  buildBrandedEmailHtml,
  escapeHtml,
  getDashboardBaseUrl,
  getWebBaseUrl,
  sendManagedEmail,
} from "../core.js"

export async function sendProvisionedEmail(input: {
  to: string
  firstName: string
  instanceId: number
  planName: string
  ipAddress: string
  username: string | null
  password: string | null
}) {
  const instanceUrl = new URL(
    `/instances/${input.instanceId}`,
    getDashboardBaseUrl()
  ).toString()
  const safeName = escapeHtml(input.firstName)
  const safePlanName = escapeHtml(input.planName)
  const safeIp = escapeHtml(input.ipAddress)
  const safeUser = escapeHtml(input.username ?? "Not set")
  const safePassword = escapeHtml(input.password ?? "Not set")
  const detailsHtml = `
    <p style="margin: 0; font-size: 15px; color: #10231b;">Hi ${safeName}, your <strong>${safePlanName}</strong> instance is now provisioned.</p>
    <div style="margin: 22px auto 0; border-radius: 16px; background: #f5f8f7; padding: 18px; text-align: left;">
      <p style="margin: 0 0 10px; font-size: 13px; color: #5d746b;">Connection details</p>
      <p style="margin: 0; font-size: 14px; color: #10231b;"><strong>IP:</strong> ${safeIp}</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #10231b;"><strong>Username:</strong> ${safeUser}</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #10231b;"><strong>Password:</strong> ${safePassword}</p>
    </div>
  `

  return sendManagedEmail({
    templateKey: "instance_provisioned",
    to: input.to,
    variables: {
      firstName: input.firstName,
      instanceId: String(input.instanceId),
      planName: input.planName,
      ipAddress: input.ipAddress,
      username: input.username ?? "",
      password: input.password ?? "",
      instanceUrl,
      logoUrl: `${getWebBaseUrl()}/favicon-96x96.png`,
    },
    fallbackSubject: `Instance #${input.instanceId} is ready`,
    fallbackText: `Hi ${input.firstName}, your ${input.planName} instance is ready. IP: ${input.ipAddress}. Username: ${input.username ?? "Not set"}. Password: ${input.password ?? "Not set"}. View: ${instanceUrl}`,
    fallbackHtml: buildBrandedEmailHtml({
      title: "Your instance is ready",
      intro: "Your TrueRDP instance has been provisioned and is ready to use.",
      bodyHtml: detailsHtml,
      buttonHref: instanceUrl,
      buttonLabel: "Open instance details",
      directLinkLabel:
        "If the button does not work, click this link directly:",
      footer: "Keep these credentials private and do not share them.",
    }),
    tags: [{ name: "category", value: "instance_provisioned" }],
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

