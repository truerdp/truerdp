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

const billingDetailsSchema = {
  type: "object",
  required: billingFieldsRequired,
  properties: billingFieldProperties,
}

export const userProfileProperties = {
  id: { type: "integer" },
  email: { type: "string" },
  firstName: { type: "string" },
  lastName: { type: "string" },
  role: { type: "string" },
  createdAt: { type: "string", format: "date-time" },
  billingDetails: {
    anyOf: [billingDetailsSchema, { type: "null" }],
  },
}

export const getCurrentUserResponseSchema = {
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: userProfileProperties,
    },
  },
}

export const getUserProfileResponseSchema = {
  type: "object",
  properties: userProfileProperties,
}

export const updateProfileBodySchema = {
  type: "object",
  required: ["firstName", "lastName", "email"],
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string", format: "email" },
    billingDetails: {
      type: "object",
      required: [
        "phone",
        "addressLine1",
        "city",
        "state",
        "postalCode",
        "country",
      ],
      properties: {
        phone: { type: "string" },
        companyName: { type: "string", nullable: true },
        taxId: { type: "string", nullable: true },
        addressLine1: { type: "string" },
        addressLine2: { type: "string", nullable: true },
        city: { type: "string" },
        state: { type: "string" },
        postalCode: { type: "string" },
        country: { type: "string" },
      },
    },
  },
}

export const getCurrentUserSchema = {
  tags: ["User"],
  summary: "Get current user (session)",
  security: [{ bearerAuth: [] }],
  response: {
    200: getCurrentUserResponseSchema,
  },
}

export const getUserProfileSchema = {
  tags: ["User"],
  summary: "Get user profile",
  security: [{ bearerAuth: [] }],
  response: {
    200: getUserProfileResponseSchema,
    404: errorResponse,
    500: errorResponse,
  },
}

export const updateProfileSchema = {
  tags: ["User"],
  summary: "Update user profile",
  security: [{ bearerAuth: [] }],
  body: updateProfileBodySchema,
  response: {
    200: getUserProfileResponseSchema,
    404: errorResponse,
    409: errorResponse,
    500: errorResponse,
  },
}
