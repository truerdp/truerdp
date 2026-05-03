import { FastifyInstance } from "fastify"

import { registerInstanceListRoutes } from "./instance/list.js"
import { registerInstanceDetailRoutes } from "./instance/detail.js"
import { registerInstanceCredentialsRoutes } from "./instance/credentials.js"
import { registerInstanceRenewRoutes } from "./instance/renew.js"
import { registerInstanceTransactionRoutes } from "./instance/transactions.js"

export async function instanceRoutes(server: FastifyInstance) {
  await registerInstanceListRoutes(server)
  await registerInstanceDetailRoutes(server)
  await registerInstanceCredentialsRoutes(server)
  await registerInstanceRenewRoutes(server)
  registerInstanceTransactionRoutes(server)
}
