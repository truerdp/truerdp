import type { FastifyInstance } from "fastify"
import { fromNodeHeaders } from "better-auth/node"
import { client } from "../db.js"
import { auth } from "../auth.js"

function resolveProtocol(headers: Record<string, unknown>) {
  const forwardedProto = headers["x-forwarded-proto"]

  if (typeof forwardedProto === "string" && forwardedProto.length > 0) {
    return forwardedProto.split(",")[0]?.trim() || "http"
  }

  return "http"
}

function buildRequestBody(request: { method: string; body?: unknown }) {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined
  }

  if (request.body === undefined || request.body === null) {
    return undefined
  }

  if (typeof request.body === "string") {
    return request.body
  }

  if (
    request.body instanceof URLSearchParams ||
    request.body instanceof FormData ||
    request.body instanceof ArrayBuffer ||
    request.body instanceof Uint8Array
  ) {
    return request.body
  }

  return JSON.stringify(request.body)
}

function appendQueryParam(urlString: string, key: string, value: string) {
  const url = new URL(urlString)
  url.searchParams.set(key, value)
  return url.toString()
}

async function isEmailAlreadyVerified(token: string) {
  try {
    const payloadPart = token.split(".")[1]

    if (!payloadPart) {
      return false
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8")
    ) as { email?: unknown }

    const email = payload.email

    if (typeof email !== "string" || !email) {
      return false
    }

    const rows = (await client`
      select email_verified as "emailVerified"
      from users
      where email = ${email}
      limit 1
    `) as Array<{ emailVerified: boolean }>

    return rows[0]?.emailVerified === true
  } catch {
    return false
  }
}

export async function betterAuthRoutes(server: FastifyInstance) {
  const handler = async (
    request: {
      method: string
      url: string
      body?: unknown
      headers: Record<string, unknown>
    },
    reply: {
      status: (code: number) => unknown
      header: (name: string, value: unknown) => unknown
      send: (payload?: unknown) => unknown
    }
  ) => {
    try {
      const host = request.headers.host
      const base = `${resolveProtocol(request.headers)}://${host}`
      const url = new URL(request.url, base)
      const headers = fromNodeHeaders(
        request.headers as Record<string, string | string[] | undefined>
      )
      const body = buildRequestBody(request)

      if (
        request.method === "GET" &&
        url.pathname === "/api/auth/verify-email"
      ) {
        const token = url.searchParams.get("token")
        const callbackURL = url.searchParams.get("callbackURL")

        if (token && callbackURL && (await isEmailAlreadyVerified(token))) {
          const location = appendQueryParam(callbackURL, "alreadyVerified", "1")
          reply.status(302)
          reply.header("location", location)
          return reply.send()
        }
      }

      if (body && !headers.has("content-type")) {
        headers.set("content-type", "application/json")
      }

      const authRequest = new Request(url.toString(), {
        method: request.method,
        headers,
        body,
      })

      const response = await auth.handler(authRequest)

      reply.status(response.status)

      const setCookies = response.headers.getSetCookie?.() ?? []
      if (setCookies.length > 0) {
        reply.header("set-cookie", setCookies)
      }

      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          return
        }

        reply.header(key, value)
      })

      if (!response.body) {
        return reply.send()
      }

      return reply.send(await response.text())
    } catch (error) {
      server.log.error(error)
      reply.status(500)
      return reply.send({ error: "Authentication error" })
    }
  }

  server.route({
    method: ["GET", "POST"],
    url: "/api/auth",
    handler,
  })

  server.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler,
  })
}
