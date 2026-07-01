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

export const instanceTransactionSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    amount: { type: "integer" },
    method: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    confirmedAt: { type: ["string", "null"], format: "date-time" },
    reference: { type: ["string", "null"] },
    cryptoTxId: { type: ["string", "null"] },
    failureReason: { type: ["string", "null"] },
    kind: { type: "string" },
    orderId: { type: "integer" },
    order: {
      type: "object",
      properties: {
        id: { type: "integer" },
        status: { type: "string" },
      },
      required: ["id", "status"],
    },
    invoice: {
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
    },
  },
  required: [
    "id",
    "amount",
    "method",
    "status",
    "createdAt",
    "confirmedAt",
    "reference",
    "cryptoTxId",
    "failureReason",
    "kind",
    "orderId",
    "order",
    "invoice",
  ],
}

export const instanceSummaryResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    orderId: { type: "integer" },
    status: { type: "string" },
    ipAddress: { type: ["string", "null"] },
    username: { type: ["string", "null"] },
    startDate: { type: ["string", "null"], format: "date-time" },
    expiryDate: { type: ["string", "null"], format: "date-time" },
  },
  required: [
    "id",
    "orderId",
    "status",
    "ipAddress",
    "username",
    "startDate",
    "expiryDate",
  ],
}

export const listInstancesSchema = {
  tags: ["Instances"],
  summary: "List user instances",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: "array",
      items: instanceSummaryResponseSchema,
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
    200: instanceSummaryResponseSchema,
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
        orderId: { type: "integer" },
      },
      required: ["message", "orderId"],
    },
    400: errorResponse,
    403: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
}

export const listInstanceTransactionsSchema = {
  tags: ["Instances"],
  summary: "List instance transactions",
  security: [{ bearerAuth: [] }],
  params: idParamSchema,
  response: {
    200: {
      type: "array",
      items: instanceTransactionSummarySchema,
    },
    404: errorResponse,
    500: errorResponse,
  },
}
