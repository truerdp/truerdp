export { sendEmail, type SendEmailResult } from "./email/core.js"
export {
  sendAdminAlertEmail,
  sendExpiryReminderEmail,
  sendInvoiceCreatedEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmedEmail,
  sendPaymentFailedEmail,
  sendProvisionedEmail,
  sendWelcomeEmail,
} from "./email/templates.js"

