import { FastifyInstance } from "fastify"
import { desc, eq, sql } from "drizzle-orm"
import { db } from "../../db.js"
import { coupons, couponUsages } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import { couponInputSchema } from "./shared.js"
import { syncCouponToDodo } from "./dodo-sync.js"

export async function registerAdminCouponsListCreateRoutes(
  server: FastifyInstance
) {
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
            maxUsesPerCustomer: coupons.maxUsesPerCustomer,
            expiresAt: coupons.expiresAt,
            dodoDiscountId: coupons.dodoDiscountId,
            dodoSyncStatus: coupons.dodoSyncStatus,
            dodoSyncError: coupons.dodoSyncError,
            dodoSyncedAt: coupons.dodoSyncedAt,
            isActive: coupons.isActive,
            createdAt: coupons.createdAt,
            updatedAt: coupons.updatedAt,
            usageCount: sql<number>`count(${couponUsages.id})::int`,
          })
          .from(coupons)
          .leftJoin(couponUsages, eq(couponUsages.couponId, coupons.id))
          .groupBy(coupons.id)
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

        const [created] = await db
          .insert(coupons)
          .values({
            code: body.code.trim().toUpperCase(),
            type: body.type,
            value: body.value,
            appliesTo: body.appliesTo,
            maxUses: body.maxUses ?? null,
            maxUsesPerCustomer:
              body.maxUsesPerCustomer === undefined
                ? 1
                : body.maxUsesPerCustomer,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isActive: body.isActive,
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .returning()

        if (!created) {
          throw new Error("Failed to create coupon")
        }

        const syncResult = await syncCouponToDodo(created)
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, created.id))
          .limit(1)

        return {
          message:
            syncResult.status === "failed"
              ? "Coupon created, but Dodo discount sync needs retry"
              : "Coupon created successfully",
          coupon: coupon ?? created,
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
