export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
}

export const getCurrentUserResponseSchema = {
  type: "object",
  properties: {
    user: { type: "object" },
  },
}

export const userProfileProperties = {
  id: { type: "integer" },
  email: { type: "string" },
  firstName: { type: "string" },
  lastName: { type: "string" },
  role: { type: "string" },
  createdAt: { type: "string", format: "date-time" },
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
