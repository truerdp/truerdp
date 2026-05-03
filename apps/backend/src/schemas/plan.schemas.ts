export const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
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
      items: { type: "object" },
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
