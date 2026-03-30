import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"

const server = Fastify({
  logger: true,
})

server.register(cors, {
  origin: "*", // restrict later
})

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
