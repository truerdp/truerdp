import {
  idParamSchema,
  billingFieldProperties,
  billingFieldsRequired,
  genericObjectResponse,
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
    orderId: { type: "string" },
  },
}

export const getOrderResponseSchema = genericObjectResponse

export const updateBillingBodySchema = {
  type: "object",
  required: billingFieldsRequired,
  properties: billingFieldProperties,
}

export const updateBillingResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    orderId: { type: "string" },
    billingDetails: { type: "object" },
  },
}

export const couponBodySchema = {
  type: "object",
  properties: {
    code: { type: "string" },
  },
}

export const couponResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    order: { type: "object" },
  },
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
