import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { users } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import { getCurrentUserSchema } from "../../schemas/user.schemas.js"
import { buildUserBillingDetails } from "../../services/billing/user-billing.js"

export async function registerUserMeRoutes(server: FastifyInstance) {
  server.get(
    "/me",
    { preHandler: verifyAuth, schema: getCurrentUserSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const userId = request.user!.userId

        const result = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            dateOfBirth: users.dateOfBirth,
            billingPhone: users.billingPhone,
            billingCompanyName: users.billingCompanyName,
            billingTaxId: users.billingTaxId,
            billingAddressLine1: users.billingAddressLine1,
            billingAddressLine2: users.billingAddressLine2,
            billingCity: users.billingCity,
            billingState: users.billingState,
            billingPostalCode: users.billingPostalCode,
            billingCountry: users.billingCountry,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        const user = result[0]

        if (!user) {
          return reply.status(404).send({ error: "User not found" })
        }

        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            role: user.role,
            createdAt: user.createdAt,
            billingDetails: buildUserBillingDetails(user),
          },
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({ error: "Internal server error" })
      }
    }
  )
}
