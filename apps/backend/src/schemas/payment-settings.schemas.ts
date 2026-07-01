import { errorResponse } from "./transaction.schemas.js"

const publicPaymentMethodStateSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
  },
  required: ["enabled"],
}

const publicUsdtMethodStateSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
    walletAddress: { type: ["string", "null"] },
    qrCodeImageUrl: { type: ["string", "null"] },
  },
  required: ["enabled", "walletAddress", "qrCodeImageUrl"],
}

export const paymentSettingsResponseSchema = {
  type: "object",
  properties: {
    upiEnabled: { type: "boolean" },
    usdtTrc20Enabled: { type: "boolean" },
    dodoCheckoutEnabled: { type: "boolean" },
    coingateCheckoutEnabled: { type: "boolean" },
    paypalCheckoutEnabled: { type: "boolean" },
    usdtTrc20WalletAddress: { type: ["string", "null"] },
    usdtTrc20QrCodeImageUrl: { type: ["string", "null"] },
  },
  required: [
    "upiEnabled",
    "usdtTrc20Enabled",
    "dodoCheckoutEnabled",
    "coingateCheckoutEnabled",
    "paypalCheckoutEnabled",
    "usdtTrc20WalletAddress",
    "usdtTrc20QrCodeImageUrl",
  ],
}

export const publicPaymentSettingsResponseSchema = {
  type: "object",
  properties: {
    enabledMethods: {
      type: "array",
      items: { type: "string" },
    },
    methods: {
      type: "object",
      properties: {
        upi: publicPaymentMethodStateSchema,
        usdt_trc20: publicUsdtMethodStateSchema,
        dodo_checkout: publicPaymentMethodStateSchema,
        coingate_checkout: publicPaymentMethodStateSchema,
        paypal_checkout: publicPaymentMethodStateSchema,
      },
      required: [
        "upi",
        "usdt_trc20",
        "dodo_checkout",
        "coingate_checkout",
        "paypal_checkout",
      ],
    },
  },
  required: ["enabledMethods", "methods"],
}

export const getPublicPaymentSettingsSchema = {
  tags: ["Transactions"],
  summary: "Get public payment method settings",
  response: {
    200: publicPaymentSettingsResponseSchema,
    500: errorResponse,
  },
}

export const getAdminPaymentSettingsSchema = {
  tags: ["Admin"],
  summary: "Get admin payment settings",
  security: [{ bearerAuth: [] }],
  response: {
    200: paymentSettingsResponseSchema,
    401: errorResponse,
    403: errorResponse,
    500: errorResponse,
  },
}

export const updateAdminPaymentSettingsSchema = {
  tags: ["Admin"],
  summary: "Update admin payment settings",
  security: [{ bearerAuth: [] }],
  body: paymentSettingsResponseSchema,
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        settings: paymentSettingsResponseSchema,
      },
      required: ["message", "settings"],
    },
    400: errorResponse,
    401: errorResponse,
    403: errorResponse,
  },
}
