import { supportedPaymentMethodSchema } from "../services/billing.js"
import {
  billingFieldProperties,
  billingFieldsRequired,
} from "./common.schemas.js"

export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
}

export const createTransactionBodySchema = {
  type: "object",
  required: ["orderId", "method"],
  properties: {
    orderId: { type: "integer" },
    method: {
      type: "string",
      enum: supportedPaymentMethodSchema.options,
    },
  },
}

export const transactionIdParamSchema = {
  type: "object",
  required: ["transactionId"],
  properties: {
    transactionId: { type: "integer" },
  },
}

export const createTransactionResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    gatewayRedirectUrl: { type: ["string", "null"] },
  },
  required: ["id", "gatewayRedirectUrl"],
}

export const createTransactionSchema = {
  tags: ["Transactions"],
  summary: "Create payment transaction",
  security: [{ bearerAuth: [] }],
  body: createTransactionBodySchema,
  response: {
    201: createTransactionResponseSchema,
    400: errorResponse,
  },
}

export const transactionUserSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string" },
  },
  required: ["id", "firstName", "lastName", "email"],
}

export const transactionOrderSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    status: { type: "string" },
  },
  required: ["id", "status"],
}

export const transactionPricingSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    durationDays: { type: "integer" },
    priceUsdCents: { type: ["integer", "null"] },
  },
  required: ["id", "durationDays", "priceUsdCents"],
}

export const transactionInvoiceSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    invoiceNumber: { type: "string" },
    status: { type: "string" },
    totalAmount: { type: "integer" },
    currency: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
    paidAt: { type: ["string", "null"], format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "invoiceNumber",
    "status",
    "totalAmount",
    "currency",
    "expiresAt",
    "paidAt",
    "createdAt",
  ],
}

export const transactionPlanSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    cpu: { type: "integer" },
    ram: { type: "integer" },
    storage: { type: "integer" },
  },
  required: ["id", "name", "cpu", "ram", "storage"],
}

export const transactionInstanceSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    ipAddress: { type: ["string", "null"] },
  },
  required: ["id", "ipAddress"],
}

export const transactionSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    user: transactionUserSchema,
    amount: { type: "integer" },
    method: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    confirmedAt: { type: ["string", "null"], format: "date-time" },
    reference: { type: ["string", "null"] },
    failureReason: { type: ["string", "null"] },
    kind: { type: "string" },
    order: transactionOrderSchema,
    pricing: transactionPricingSchema,
    invoice: transactionInvoiceSchema,
    plan: transactionPlanSchema,
    instance: {
      anyOf: [transactionInstanceSchema, { type: "null" }],
    },
  },
  required: [
    "id",
    "userId",
    "user",
    "amount",
    "method",
    "status",
    "createdAt",
    "confirmedAt",
    "reference",
    "failureReason",
    "kind",
    "order",
    "pricing",
    "invoice",
    "plan",
    "instance",
  ],
}

export const listTransactionsSchema = {
  tags: ["Transactions"],
  summary: "List user transactions",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: "array",
      items: transactionSummarySchema,
    },
    500: errorResponse,
  },
}

export const getTransactionCheckoutStatusSchema = {
  tags: ["Transactions"],
  summary: "Get checkout return status from database",
  security: [{ bearerAuth: [] }],
  params: transactionIdParamSchema,
  response: {
    200: transactionSummarySchema,
    404: errorResponse,
    500: errorResponse,
  },
}

export const invoiceTransactionSchema = {
  type: "object",
  properties: {
    id: { type: ["integer", "null"] },
    reference: { type: ["string", "null"] },
    status: { type: ["string", "null"] },
    method: { type: ["string", "null"] },
  },
  required: ["id", "reference", "status", "method"],
}

export const invoiceOrderSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    status: { type: "string" },
    billingDetails: {
      anyOf: [
        {
          type: "object",
          properties: billingFieldProperties,
          required: billingFieldsRequired,
        },
        { type: "null" },
      ],
    },
  },
  required: ["id", "status", "billingDetails"],
}

export const invoicePlanSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    durationDays: { type: "integer" },
    kind: { type: "string" },
  },
  required: ["name", "durationDays", "kind"],
}

export const invoiceSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    invoiceNumber: { type: "string" },
    status: { type: "string" },
    totalAmount: { type: "integer" },
    currency: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    expiresAt: { type: ["string", "null"], format: "date-time" },
    paidAt: { type: ["string", "null"], format: "date-time" },
    transaction: invoiceTransactionSchema,
    order: invoiceOrderSchema,
    plan: invoicePlanSchema,
  },
  required: [
    "id",
    "invoiceNumber",
    "status",
    "totalAmount",
    "currency",
    "createdAt",
    "expiresAt",
    "paidAt",
    "transaction",
    "order",
    "plan",
  ],
}

export const syncCoinGateSchema = {
  tags: ["Transactions"],
  summary: "Sync CoinGate transaction status",
  security: [{ bearerAuth: [] }],
  params: transactionIdParamSchema,
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        duplicate: { type: "boolean" },
        eventId: { type: "string" },
        processingStatus: { type: "string" },
      },
      required: ["message", "duplicate", "eventId", "processingStatus"],
    },
    400: errorResponse,
    403: errorResponse,
    404: errorResponse,
  },
}

export const listInvoicesSchema = {
  tags: ["Transactions"],
  summary: "List user invoices",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: "array",
      items: invoiceSummarySchema,
    },
    500: errorResponse,
  },
}
