export type CoinGateOrderResponse = {
  id?: number | string
  order_id?: string | null
  status?: string | null
  payment_url?: string | null
  token?: string | null
  price_amount?: number | string | null
  price_currency?: string | null
  created_at?: string | null
  updated_at?: string | null
  paid_at?: string | null
}

export type CoinGateShopperInput = {
  ipAddress?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  companyName?: string | null
  taxId?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}
