import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db.js"
import * as schema from "./schema.js"
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./services/email.js"

function ensureFrontendCallback(urlString: string) {
  try {
    const webBase = (
      process.env.WEB_BASE_URL || "http://localhost:3000"
    ).replace(/\/$/, "")
    const url = new URL(urlString)

    const cbKey = url.searchParams.has("callbackURL")
      ? "callbackURL"
      : url.searchParams.has("redirectTo")
        ? "redirectTo"
        : "callbackURL"

    const cb = url.searchParams.get(cbKey)

    if (cb) {
      try {
        new URL(cb)
        // absolute URL — leave as-is
      } catch {
        // relative path — make absolute to frontend
        const newCb = cb.startsWith("/")
          ? `${webBase}${cb}`
          : `${webBase}/${cb}`
        url.searchParams.set(cbKey, newCb)
      }
    } else {
      // ensure there's at least a root callback to the frontend
      url.searchParams.set("callbackURL", `${webBase}/`)
    }

    return url.toString()
  } catch {
    return urlString
  }
}

function getTrustedOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configuredOrigins.length > 0) {
    return configuredOrigins
  }

  if (process.env.NODE_ENV === "production") {
    return []
  }

  return [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ]
}

function getAuthBaseUrl() {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }

  const port = Number(process.env.PORT) || 3003
  return `http://localhost:${port}`
}

export const auth = betterAuth({
  appName: "TrueRDP",
  baseURL: getAuthBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: ["user", "operator", "admin"],
        input: false,
        required: false,
        defaultValue: "user",
      },
      firstName: {
        type: "string",
        input: true,
        required: true,
      },
      lastName: {
        type: "string",
        input: true,
        required: true,
      },
      billingPhone: {
        type: "string",
        input: true,
        required: true,
      },
      billingCompanyName: {
        type: "string",
        input: true,
        required: false,
      },
      billingTaxId: {
        type: "string",
        input: true,
        required: false,
      },
      billingAddressLine1: {
        type: "string",
        input: true,
        required: true,
      },
      billingAddressLine2: {
        type: "string",
        input: true,
        required: false,
      },
      billingCity: {
        type: "string",
        input: true,
        required: true,
      },
      billingState: {
        type: "string",
        input: true,
        required: true,
      },
      billingPostalCode: {
        type: "string",
        input: true,
        required: true,
      },
      billingCountry: {
        type: "string",
        input: true,
        required: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: ensureFrontendCallback(url),
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        verificationUrl: ensureFrontendCallback(url),
      })
    },
  },
})
