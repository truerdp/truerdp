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
      enum: ["razorpay", "coingate_checkout", "manual"],
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

export const createTransactionSchema = {
  tags: ["Transactions"],
  summary: "Create payment transaction",
  security: [{ bearerAuth: [] }],
  body: createTransactionBodySchema,
  response: {
    201: { type: "object" },
    400: errorResponse,
  },
}

export const listTransactionsSchema = {
  tags: ["Transactions"],
  summary: "List user transactions",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: "array",
      items: { type: "object" },
    },
    500: errorResponse,
  },
}

export const syncCoinGateSchema = {
  tags: ["Transactions"],
  summary: "Sync CoinGate transaction status",
  security: [{ bearerAuth: [] }],
  params: transactionIdParamSchema,
  response: {
    200: { type: "object" },
    400: errorResponse,
    403: errorResponse,
    404: errorResponse,
  },
}

export const hostedReturnSchema = {
  tags: ["Transactions"],
  summary: "Handle hosted checkout return",
  security: [{ bearerAuth: [] }],
  params: transactionIdParamSchema,
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string" },
      paymentId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        transactionId: { type: "integer" },
        status: { type: "string" },
      },
    },
    400: errorResponse,
  },
}

export const listInvoicesSchema = {
  tags: ["Transactions"],
  summary: "List user invoices",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: "array",
      items: { type: "object" },
    },
    500: errorResponse,
  },
}
