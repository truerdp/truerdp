export type PayPalLink = {
  href?: string
  rel?: string
  method?: string
}

export type PayPalOrderResponse = {
  id?: string
  status?: string
  links?: PayPalLink[]
  purchase_units?: unknown[]
}

export type PayPalWebhookVerificationResponse = {
  verification_status?: string
}
