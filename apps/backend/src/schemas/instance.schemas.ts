export const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer" },
  },
}

export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
}

export const listInstancesSchema = {
  tags: ["Instances"],
  summary: "List user instances",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: "array",
      items: { type: "object" },
    },
    500: errorResponse,
  },
}

export const getInstanceSchema = {
  tags: ["Instances"],
  summary: "Get instance by ID",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  response: {
    200: { type: "object" },
    404: errorResponse,
    403: errorResponse,
    500: errorResponse,
  },
}

export const getInstanceCredentialsSchema = {
  tags: ["Instances"],
  summary: "Get instance RDP credentials",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  response: {
    200: {
      type: "object",
      properties: {
        ipAddress: { type: "string" },
        username: { type: "string" },
        password: { type: "string" },
      },
    },
    404: errorResponse,
    403: errorResponse,
    400: errorResponse,
    500: errorResponse,
  },
}

export const renewInstanceSchema = {
  tags: ["Instances"],
  summary: "Renew instance",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  body: {
    type: "object",
    properties: {
      planPricingId: { type: "integer" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        orderId: { type: "string" },
      },
    },
    400: errorResponse,
    403: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
}
