import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { coupons } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import { couponInputSchema, couponStatusSchema } from "./shared.js"
import { syncCouponToDodo } from "./dodo-sync.js"

export async function registerAdminCouponsUpdateStatusRoutes(
  server: FastifyInstance
) {
  server.put(
    "/admin/coupons/:id",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const couponId = Number((request.params as Record<string, unknown>).id)

        if (Number.isNaN(couponId)) {
          return reply.status(400).send({ error: "Invalid coupon id" })
        }

        const body = couponInputSchema.parse(request.body ?? {})
        const [updated] = await db
          .update(coupons)
          .set({
            code: body.code.trim().toUpperCase(),
            type: body.type,
            value: body.value,
            appliesTo: body.appliesTo,
            maxUses: body.maxUses ?? null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isActive: body.isActive,
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!updated) {
          return reply.status(404).send({ error: "Coupon not found" })
        }

        const syncResult = await syncCouponToDodo(updated)
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, updated.id))
          .limit(1)

        return {
          message:
            syncResult.status === "failed"
              ? "Coupon updated, but Dodo discount sync needs retry"
              : "Coupon updated successfully",
          coupon: coupon ?? updated,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.patch(
    "/admin/coupons/:id/status",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const couponId = Number((request.params as Record<string, unknown>).id)

        if (Number.isNaN(couponId)) {
          return reply.status(400).send({ error: "Invalid coupon id" })
        }

        const body = couponStatusSchema.parse(request.body ?? {})
        const [updated] = await db
          .update(coupons)
          .set({
            isActive: body.isActive,
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!updated) {
          return reply.status(404).send({ error: "Coupon not found" })
        }

        const syncResult = await syncCouponToDodo(updated)
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, updated.id))
          .limit(1)

        return {
          message:
            syncResult.status === "failed"
              ? "Coupon status updated, but Dodo discount sync needs retry"
              : body.isActive
                ? "Coupon activated successfully"
                : "Coupon deactivated successfully",
          coupon: coupon ?? updated,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.post(
    "/admin/coupons/:id/sync-dodo",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const couponId = Number((request.params as Record<string, unknown>).id)

        if (Number.isNaN(couponId)) {
          return reply.status(400).send({ error: "Invalid coupon id" })
        }

        const [coupon] = await db
          .update(coupons)
          .set({
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!coupon) {
          return reply.status(404).send({ error: "Coupon not found" })
        }

        const syncResult = await syncCouponToDodo(coupon)

        return {
          message:
            syncResult.status === "failed"
              ? "Dodo discount sync failed"
              : "Dodo discount sync completed",
          dodoSync: syncResult,
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
