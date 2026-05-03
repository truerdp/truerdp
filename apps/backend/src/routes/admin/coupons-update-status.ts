import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { coupons } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  couponInputSchema,
  couponStatusSchema,
  syncCouponToDodo,
} from "./shared.js"

export async function registerAdminCouponsUpdateStatusRoutes(server: FastifyInstance) {
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
      const updated = await db.transaction(async (tx) => {
        const [coupon] = await tx
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

        if (!coupon) {
          return null
        }

        await syncCouponToDodo(tx, coupon)

        const [synced] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.id, coupon.id))
          .limit(1)

        return synced ?? coupon
      })

      if (!updated) {
        return reply.status(404).send({ error: "Coupon not found" })
      }

      return {
        message: "Coupon updated successfully",
        coupon: updated,
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
      const updated = await db.transaction(async (tx) => {
        const [coupon] = await tx
          .update(coupons)
          .set({
            isActive: body.isActive,
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!coupon) {
          return null
        }

        await syncCouponToDodo(tx, coupon)

        const [synced] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.id, coupon.id))
          .limit(1)

        return synced ?? coupon
      })

      if (!updated) {
        return reply.status(404).send({ error: "Coupon not found" })
      }

      return {
        message: body.isActive
          ? "Coupon activated successfully"
          : "Coupon deactivated successfully",
        coupon: updated,
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
