import { createAuthClient } from "better-auth/client"
import { inferAdditionalFields } from "better-auth/client/plugins"

function getAuthServerBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : undefined
}

export const authClient = createAuthClient({
  baseURL: getAuthServerBaseUrl(),
  plugins: [
    inferAdditionalFields({
      user: {
        firstName: {
          type: "string",
          required: true,
        },
        lastName: {
          type: "string",
          required: true,
        },
        dateOfBirth: {
          type: "string",
          required: true,
        },
        role: {
          type: "string",
          required: false,
        },
        billingPhone: {
          type: "string",
          required: true,
        },
        billingCompanyName: {
          type: "string",
          required: false,
        },
        billingTaxId: {
          type: "string",
          required: false,
        },
        billingAddressLine1: {
          type: "string",
          required: true,
        },
        billingAddressLine2: {
          type: "string",
          required: false,
        },
        billingCity: {
          type: "string",
          required: true,
        },
        billingState: {
          type: "string",
          required: true,
        },
        billingPostalCode: {
          type: "string",
          required: true,
        },
        billingCountry: {
          type: "string",
          required: true,
        },
      },
    }),
  ],
})
