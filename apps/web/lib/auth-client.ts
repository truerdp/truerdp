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
          required: false,
        },
        lastName: {
          type: "string",
          required: false,
        },
        role: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
})
