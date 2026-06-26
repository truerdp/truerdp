import { FastifyInstance } from "fastify"

import { registerTransactionCreateRoutes } from "./transaction/create.js"
import { registerTransactionListRoutes } from "./transaction/list.js"
import { registerTransactionPayPalReturnRoutes } from "./transaction/paypal-return.js"
import { registerTransactionSyncRoutes } from "./transaction/sync-coingate.js"

export async function transactionRoutes(server: FastifyInstance) {
  await registerTransactionCreateRoutes(server)
  await registerTransactionListRoutes(server)
  await registerTransactionPayPalReturnRoutes(server)
  await registerTransactionSyncRoutes(server)
}
