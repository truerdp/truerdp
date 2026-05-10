export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
}

const planPricingOptionSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    durationDays: { type: "integer" },
    priceUsdCents: { type: "integer" },
    isActive: { type: "boolean" },
    dodoProductId: { type: ["string", "null"] },
    dodoSyncStatus: { type: "string" },
    dodoSyncError: { type: ["string", "null"] },
    dodoSyncedAt: { type: ["string", "null"], format: "date-time" },
  },
  required: ["id", "durationDays", "priceUsdCents", "isActive"],
}

const planWithPricingSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    cpu: { type: "integer" },
    cpuName: { type: "string" },
    cpuThreads: { type: "integer" },
    ram: { type: "integer" },
    ramType: { type: "string" },
    storage: { type: "integer" },
    storageType: { type: "string" },
    bandwidth: { type: "string" },
    os: { type: "string" },
    osVersion: { type: "string" },
    planType: { type: "string" },
    portSpeed: { type: "string" },
    setupFees: { type: "integer" },
    planLocation: { type: "string" },
    isActive: { type: "boolean" },
    isFeatured: { type: "boolean" },
    defaultPricingId: { type: ["integer", "null"] },
    pricingOptions: {
      type: "array",
      items: planPricingOptionSchema,
    },
  },
  required: ["id", "name", "pricingOptions"],
}

export const listPlansQuerySchema = {
  type: "object",
  properties: {
    planType: { type: "string", enum: ["Dedicated", "Residential"] },
    planLocation: { type: "string" },
  },
}

export const listPlansSchema = {
  tags: ["Plans"],
  summary: "List active plans",
  querystring: listPlansQuerySchema,
  response: {
    200: {
      type: "array",
      items: planWithPricingSchema,
    },
    400: errorResponse,
    500: errorResponse,
  },
}

export const listPlanCategoriesSchema = {
  tags: ["Plans"],
  summary: "List plan categories",
  response: {
    200: {
      type: "object",
      properties: {
        planTypes: { type: "array", items: { type: "string" } },
        planLocations: { type: "array", items: { type: "string" } },
      },
    },
    500: errorResponse,
  },
}
