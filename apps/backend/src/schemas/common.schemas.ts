// Shared OpenAPI schema definitions for reusable components

export const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer" },
  },
}

export const genericObjectResponse = { type: "object" }
export const stringResponse = { type: "string" }
export const arrayResponse = { type: "array", items: { type: "object" } }

// Common field definitions
export const billingFieldProperties = {
  firstName: { type: "string" },
  lastName: { type: "string" },
  email: { type: "string", format: "email" },
  phone: { type: "string" },
  companyName: { type: "string", nullable: true },
  taxId: { type: "string", nullable: true },
  addressLine1: { type: "string" },
  addressLine2: { type: "string", nullable: true },
  city: { type: "string" },
  state: { type: "string" },
  postalCode: { type: "string" },
  country: { type: "string" },
}

export const billingFieldsRequired = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
]
