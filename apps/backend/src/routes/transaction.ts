import { FastifyInstance } from "fastify"

import { registerTransactionCreateRoutes } from "./transaction/create.js"
import { registerTransactionListRoutes } from "./transaction/list.js"
import { registerTransactionSyncRoutes } from "./transaction/sync-coingate.js"
import { registerTransactionHostedReturnRoutes } from "./transaction/hosted-return.js"

export async function transactionRoutes(server: FastifyInstance) {
  await registerTransactionCreateRoutes(server)
  await registerTransactionListRoutes(server)
  await registerTransactionSyncRoutes(server)
  await registerTransactionHostedReturnRoutes(server)
}
