import "dotenv/config"
import Fastify from "fastify"
import { parse as parseQueryString } from "node:querystring"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import { userRoutes } from "./routes/user.js"
import { authRoutes } from "./routes/auth.js"
import { transactionRoutes } from "./routes/transaction.js"
import { adminRoutes } from "./routes/admin.js"
import { instanceRoutes } from "./routes/instance.js"
import { planRoutes } from "./routes/plan.js"
import { webhookRoutes } from "./routes/webhook.js"
import { orderRoutes } from "./routes/order.js"
import { supportRoutes } from "./routes/support.js"
import { contentRoutes } from "./routes/content.js"
import fastifyRawBody from "fastify-raw-body"

const server = Fastify({
  logger: true,
})

// Expose request.rawBody for webhook signature verification (run before body parsing)
server.register(fastifyRawBody, {
  field: "rawBody",
  global: true,
  runFirst: true,
})

server.addContentTypeParser(
  /^application\/x-www-form-urlencoded(?:;.*)?$/,
  { parseAs: "string" },
  (_request, body: string, done) => {
    done(null, parseQueryString(body))
  }
)

const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
)

const allowAllOrigins =
  process.env.NODE_ENV !== "production" && allowedOrigins.size === 0

server.register(cookie)

server.register(cors, {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowAllOrigins || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    callback(new Error("Not allowed by CORS"), false)
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
})

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])

server.addHook("onRequest", async (request, reply) => {
  if (!mutatingMethods.has(request.method.toUpperCase())) {
    return
  }

  const origin = request.headers.origin

  if (!origin || allowAllOrigins) {
    return
  }

  if (!allowedOrigins.has(origin)) {
    return reply.status(403).send({ error: "Forbidden origin" })
  }
})

server.register(userRoutes)
server.register(authRoutes)
server.register(planRoutes)
server.register(orderRoutes)
server.register(transactionRoutes)
server.register(adminRoutes)
server.register(instanceRoutes)
server.register(supportRoutes)
server.register(contentRoutes)
server.register(webhookRoutes)

server.get("/", async () => {
  return { status: "ok", message: "Truerdp API is running" }
})

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3003

    await server.listen({
      port,
      host: "0.0.0.0",
    })

    console.log(`Server listening at http://0.0.0.0:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
