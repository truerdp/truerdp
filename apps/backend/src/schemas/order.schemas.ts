import {
  idParamSchema,
  billingFieldProperties,
  billingFieldsRequired,
} from "./common.schemas.js"

export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
}

export const createOrderBodySchema = {
  type: "object",
  required: ["planPricingId"],
  properties: {
    planPricingId: { type: "integer" },
    instanceId: { type: "integer" },
  },
}

export const createOrderResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "integer" },
  },
  required: ["orderId"],
}

export const orderPlanSchema = {
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

export const orderPricingSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    durationDays: { type: "integer" },
    priceUsdCents: { type: "integer" },
  },
  required: ["id", "durationDays", "priceUsdCents"],
}

export const orderItemSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    planId: { type: "integer" },
    planPricingId: { type: "integer" },
    planName: { type: "string" },
    planPriceUsdCents: { type: "integer" },
    durationDays: { type: "integer" },
    quantity: { type: "integer" },
    lineTotalUsdCents: { type: "integer" },
  },
  required: [
    "id",
    "planId",
    "planPricingId",
    "planName",
    "planPriceUsdCents",
    "durationDays",
    "quantity",
    "lineTotalUsdCents",
  ],
}

export const orderInvoiceSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    invoiceNumber: { type: "string" },
    subtotal: { type: "integer" },
    discount: { type: "integer" },
    totalAmount: { type: "integer" },
    currency: { type: "string" },
    couponId: { type: ["integer", "null"] },
    couponCode: { type: ["string", "null"] },
    status: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
    paidAt: { type: ["string", "null"], format: "date-time" },
  },
  required: [
    "id",
    "invoiceNumber",
    "subtotal",
    "discount",
    "totalAmount",
    "currency",
    "couponId",
    "couponCode",
    "status",
    "expiresAt",
    "paidAt",
  ],
}

export const orderBillingDetailsSchema = {
  type: "object",
  properties: billingFieldProperties,
  required: billingFieldsRequired,
}

export const billingOrderResponseSchema = {
  type: "object",
  properties: {
    orderId: { type: "integer" },
    userId: { type: "integer" },
    kind: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    billingDetails: {
      anyOf: [orderBillingDetailsSchema, { type: "null" }],
    },
    plan: orderPlanSchema,
    pricing: orderPricingSchema,
    items: {
      type: "array",
      items: orderItemSchema,
    },
    invoice: {
      anyOf: [orderInvoiceSchema, { type: "null" }],
    },
  },
  required: [
    "orderId",
    "userId",
    "kind",
    "status",
    "createdAt",
    "updatedAt",
    "billingDetails",
    "plan",
    "pricing",
    "items",
    "invoice",
  ],
}

export const getOrderResponseSchema = billingOrderResponseSchema

export const updateBillingBodySchema = {
  type: "object",
  required: billingFieldsRequired,
  properties: billingFieldProperties,
}

export const updateBillingResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    orderId: { type: "integer" },
    billingDetails: orderBillingDetailsSchema,
  },
  required: ["message", "orderId", "billingDetails"],
}

export const couponBodySchema = {
  type: "object",
  properties: {
    code: {
      type: ["string", "null"],
      minLength: 1,
      description: "Coupon code to apply. Send null to remove the coupon.",
    },
  },
  additionalProperties: false,
}

export const couponResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    order: billingOrderResponseSchema,
  },
  required: ["message", "order"],
}

export const createOrderSchema = {
  tags: ["Orders"],
  summary: "Create billing order",
  security: [{ bearerAuth: [] }],
  body: createOrderBodySchema,
  response: {
    201: createOrderResponseSchema,
    400: errorResponse,
  },
}

export const getOrderSchema = {
  tags: ["Orders"],
  summary: "Get order by ID",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  response: {
    200: getOrderResponseSchema,
    400: errorResponse,
    404: errorResponse,
  },
}

export const updateBillingSchema = {
  tags: ["Orders"],
  summary: "Update billing details",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  body: updateBillingBodySchema,
  response: {
    200: updateBillingResponseSchema,
    400: errorResponse,
  },
}

export const couponSchema = {
  tags: ["Orders"],
  summary: "Apply or remove coupon",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  body: couponBodySchema,
  response: {
    200: couponResponseSchema,
    400: errorResponse,
  },
}
