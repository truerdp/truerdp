import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
// import { db } from "./db.js"
import { users } from "./schema.js"

const server = Fastify({
  logger: true,
})

server.register(cors, {
  origin: "*",
})

server.get("/", async (request, reply) => {
  return { status: "ok", message: "Truerdp API is running" }
})

// server.get("/users", async (request, reply) => {
//   const allUsers = await db.select().from(users)
//   return allUsers
// })

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3003
    await server.listen({ port, host: "0.0.0.0" })
    console.log(`Server listening at http://localhost:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
