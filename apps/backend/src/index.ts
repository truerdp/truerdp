import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { userRoutes } from "./routes/user.js"
import { authRoutes } from "./routes/auth.js"
import { transactionRoutes } from "./routes/transaction.js"
import { adminRoutes } from "./routes/admin.js"
import { instanceRoutes } from "./routes/instance.js"
import { planRoutes } from "./routes/plan.js"
import { webhookRoutes } from "./routes/webhook.js"

const server = Fastify({
  logger: true,
})

server.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})

server.register(userRoutes)
server.register(authRoutes)
server.register(planRoutes)
server.register(transactionRoutes)
server.register(adminRoutes)
server.register(instanceRoutes)
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
