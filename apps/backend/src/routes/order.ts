import { FastifyInstance } from "fastify"

import { registerOrderCreateRoutes } from "./order/create.js"
import { registerOrderGetRoutes } from "./order/get.js"
import { registerOrderBillingRoutes } from "./order/billing.js"
import { registerOrderCouponRoutes } from "./order/coupon.js"

export async function orderRoutes(server: FastifyInstance) {
  await registerOrderCreateRoutes(server)
  await registerOrderGetRoutes(server)
  await registerOrderBillingRoutes(server)
  await registerOrderCouponRoutes(server)
}
