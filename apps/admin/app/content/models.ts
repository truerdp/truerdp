export type EmailTemplate = {
  id: number
  key: string
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string | null
  isActive: boolean
  updatedAt: string
}

export const defaultTemplateKeys = [
  "welcome",
  "password_reset",
  "invoice_created",
  "payment_confirmed",
  "payment_failed",
  "instance_provisioned",
  "expiry_reminder",
  "admin_alert",
]

export type EmailTemplateSample = {
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string | null
  isActive: boolean
}

export type TemplateDraft = {
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string
  isActive: boolean
}

const defaultEmailTemplateSamples: Record<string, EmailTemplateSample> = {
  welcome: {
    subjectTemplate: "Welcome to TrueRDP",
    htmlTemplate:
      "<h1>Welcome {{firstName}}</h1><p>Your TrueRDP account is ready.</p>",
    textTemplate: "Welcome {{firstName}}, your TrueRDP account is ready.",
    isActive: true,
  },
  password_reset: {
    subjectTemplate: "Reset your TrueRDP password",
    htmlTemplate:
      '<h1>Password reset</h1><p>Use this link to reset your password: <a href="{{resetUrl}}">{{resetUrl}}</a></p>',
    textTemplate:
      "Reset your password using this link: {{resetUrl}}. This link expires in 1 hour.",
    isActive: true,
  },
  invoice_created: {
    subjectTemplate: "Invoice {{invoiceNumber}} created",
    htmlTemplate:
      '<h1>Invoice created</h1><p>Hi {{firstName}}, invoice {{invoiceNumber}} for {{planName}} is ready.</p><p>Amount due: {{amount}}</p><p><a href="{{invoiceUrl}}">View invoice</a></p>',
    textTemplate:
      "Hi {{firstName}}, invoice {{invoiceNumber}} for {{planName}} is ready. Amount due: {{amount}}. View invoice: {{invoiceUrl}}",
    isActive: true,
  },
  payment_confirmed: {
    subjectTemplate: "Payment confirmed for {{invoiceNumber}}",
    htmlTemplate:
      '<h1>Payment confirmed</h1><p>Hi {{firstName}}, payment for {{invoiceNumber}} has been confirmed.</p><p>Amount: {{amount}}</p><p><a href="{{invoiceUrl}}">View receipt</a></p>',
    textTemplate:
      "Hi {{firstName}}, payment for {{invoiceNumber}} has been confirmed. Amount: {{amount}}. View receipt: {{invoiceUrl}}",
    isActive: true,
  },
  payment_failed: {
    subjectTemplate: "Payment failed for {{invoiceNumber}}",
    htmlTemplate:
      '<h1>Payment failed</h1><p>Hi {{firstName}}, payment for invoice {{invoiceNumber}} failed.</p><p>Reason: {{reason}}</p><p><a href="{{invoiceUrl}}">Retry payment</a></p>',
    textTemplate:
      "Hi {{firstName}}, payment for invoice {{invoiceNumber}} failed. Reason: {{reason}}. Retry payment: {{invoiceUrl}}",
    isActive: true,
  },
  instance_provisioned: {
    subjectTemplate: "Instance #{{instanceId}} is ready",
    htmlTemplate:
      '<h1>Your instance is ready</h1><p>Hi {{firstName}}, your {{planName}} instance is provisioned.</p><p>IP: {{ipAddress}}</p><p>Username: {{username}}</p><p><a href="{{instanceUrl}}">Open instance</a></p>',
    textTemplate:
      "Hi {{firstName}}, your {{planName}} instance is ready. IP: {{ipAddress}} Username: {{username}}. Open instance: {{instanceUrl}}",
    isActive: true,
  },
  expiry_reminder: {
    subjectTemplate: "Instance #{{instanceId}} expires in {{daysRemaining}} day(s)",
    htmlTemplate:
      '<h1>Expiry reminder</h1><p>Hi {{firstName}}, your {{planName}} instance expires on {{expiryDate}}.</p><p><a href="{{instanceUrl}}">Review instance</a></p>',
    textTemplate:
      "Hi {{firstName}}, your {{planName}} instance expires on {{expiryDate}}. Review instance: {{instanceUrl}}",
    isActive: true,
  },
  admin_alert: {
    subjectTemplate: "{{subject}}",
    htmlTemplate: "<h1>Admin alert</h1><p>{{text}}</p><p>{{html}}</p>",
    textTemplate: "{{text}}",
    isActive: true,
  },
}

const fallbackSample: EmailTemplateSample = {
  subjectTemplate: "New template",
  htmlTemplate: "<p>{{text}}</p>",
  textTemplate: "{{text}}",
  isActive: true,
}

export function getSampleTemplate(key: string): EmailTemplateSample {
  return defaultEmailTemplateSamples[key] ?? fallbackSample
}

export const previewVariables: Record<string, string> = {
  firstName: "Alex",
  resetUrl: "https://dashboard.truerdp.com/reset-password?token=demo-token",
  invoiceNumber: "INV-2026-0042",
  planName: "Starter RDP",
  amount: "$40.00",
  invoiceUrl: "https://dashboard.truerdp.com/invoices/42",
  reason: "Insufficient funds",
  instanceId: "108",
  ipAddress: "203.0.113.25",
  username: "administrator",
  instanceUrl: "https://dashboard.truerdp.com/instances/108",
  expiryDate: "Apr 30, 2026 12:00 PM",
  daysRemaining: "5",
  subject: "Instance suspended by admin",
  text: "A new operational alert has been generated.",
  html: "<strong>Review instance actions in admin.</strong>",
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
) {
  return template.replaceAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return variables[key] ?? `{{${key}}}`
  })
}
