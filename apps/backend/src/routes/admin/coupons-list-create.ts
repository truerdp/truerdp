import { FastifyInstance } from "fastify"
import { desc, eq, sql } from "drizzle-orm"
import { db } from "../../db.js"
import { coupons, couponUsages } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import { couponInputSchema, syncCouponToDodo } from "./shared.js"

export async function registerAdminCouponsListCreateRoutes(server: FastifyInstance) {
server.get(
  "/admin/coupons",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      return await db
        .select({
          id: coupons.id,
          code: coupons.code,
          type: coupons.type,
          value: coupons.value,
          appliesTo: coupons.appliesTo,
          maxUses: coupons.maxUses,
          expiresAt: coupons.expiresAt,
          dodoDiscountId: coupons.dodoDiscountId,
          dodoSyncStatus: coupons.dodoSyncStatus,
          dodoSyncError: coupons.dodoSyncError,
          dodoSyncedAt: coupons.dodoSyncedAt,
          isActive: coupons.isActive,
          createdAt: coupons.createdAt,
          updatedAt: coupons.updatedAt,
          usageCount: sql<number>`(
            select count(*)::int
            from ${couponUsages} cu
            where cu.coupon_id = ${coupons.id}
          )`,
        })
        .from(coupons)
        .orderBy(desc(coupons.createdAt))
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(500).send({
        error: "Internal server error",
      })
    }
  }
)

server.post(
  "/admin/coupons",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const body = couponInputSchema.parse(request.body ?? {})

      const created = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(coupons)
          .values({
            code: body.code.trim().toUpperCase(),
            type: body.type,
            value: body.value,
            appliesTo: body.appliesTo,
            maxUses: body.maxUses ?? null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isActive: body.isActive,
          })
          .returning()

        if (!inserted) {
          throw new Error("Failed to create coupon")
        }

        await syncCouponToDodo(tx, inserted)

        const [synced] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.id, inserted.id))
          .limit(1)

        return synced ?? inserted
      })

      return {
        message: "Coupon created successfully",
        coupon: created,
      }
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

}
