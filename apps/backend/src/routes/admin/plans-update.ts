import { FastifyInstance } from "fastify"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "../../db.js"
import { planPricing, plans } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { syncDodoProductForPlanPricing } from "../../services/dodo-payments.js"
import { getErrorMessage } from "../../utils/error.js"
import { updatePlanSchema } from "./shared.js"

export async function registerAdminPlansUpdateRoutes(server: FastifyInstance) {
server.put(
  "/admin/plans/:id",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }
      const planId = Number((request.params as Record<string, unknown>).id)
      if (Number.isNaN(planId)) {
        return reply.status(400).send({ error: "Invalid plan id" })
      }
      const body = updatePlanSchema.parse(request.body)
      const uniqueDurations = new Set(body.pricingOptions.map((x) => x.durationDays))
      if (uniqueDurations.size !== body.pricingOptions.length) {
        return reply.status(400).send({
          error: "Pricing durations must be unique per plan",
        })
      }
      const existingPlan = await db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1)
      if (!existingPlan[0]) {
        return reply.status(404).send({
          error: "Plan not found",
        })
      }

      await db.transaction(async (tx) => {
        await tx
          .update(plans)
          .set({
            name: body.name,
            cpu: body.cpu,
            cpuName: body.cpuName,
            cpuThreads: body.cpuThreads,
            ram: body.ram,
            ramType: body.ramType,
            storage: body.storage,
            storageType: body.storageType,
            bandwidth: body.bandwidth,
            os: body.os,
            osVersion: body.osVersion,
            planType: body.planType,
            portSpeed: body.portSpeed,
            setupFees: body.setupFees,
            planLocation: body.planLocation,
            isActive: body.isActive,
            isFeatured: body.isFeatured,
            defaultPricingId: body.defaultPricingId ?? null,
          })
          .where(eq(plans.id, planId))

        const existingPricing = await tx
          .select({
            id: planPricing.id,
            durationDays: planPricing.durationDays,
            dodoProductId: planPricing.dodoProductId,
          })
          .from(planPricing)
          .where(eq(planPricing.planId, planId))

        const existingById = new Map(existingPricing.map((x) => [x.id, x]))
        const existingByDuration = new Map(
          existingPricing.map((x) => [x.durationDays, x])
        )
        const touchedPricingIds: number[] = []
        const syncTargets: Array<{
          id: number
          durationDays: number
          priceUsdCents: number
          dodoProductId: string | null
        }> = []

        for (const option of body.pricingOptions) {
          if (option.id != null) {
            const matchedById = existingById.get(option.id)

            if (!matchedById) {
              throw new Error(
                `Pricing option ${option.id} does not belong to this plan`
              )
            }

            await tx
              .update(planPricing)
              .set({
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                isActive: option.isActive,
              })
              .where(eq(planPricing.id, option.id))

            touchedPricingIds.push(option.id)
            syncTargets.push({
              id: option.id,
              durationDays: option.durationDays,
              priceUsdCents: option.priceUsdCents,
              dodoProductId: matchedById.dodoProductId,
            })
            continue
          }

          const matchedByDuration = existingByDuration.get(
            option.durationDays
          )

          if (matchedByDuration) {
            await tx
              .update(planPricing)
              .set({
                priceUsdCents: option.priceUsdCents,
                isActive: option.isActive,
              })
              .where(eq(planPricing.id, matchedByDuration.id))

            touchedPricingIds.push(matchedByDuration.id)
            syncTargets.push({
              id: matchedByDuration.id,
              durationDays: option.durationDays,
              priceUsdCents: option.priceUsdCents,
              dodoProductId: matchedByDuration.dodoProductId,
            })
            continue
          }

          const [insertedPricing] = await tx
            .insert(planPricing)
            .values({
              planId,
              durationDays: option.durationDays,
              priceUsdCents: option.priceUsdCents,
              isActive: option.isActive,
            })
            .returning({
              id: planPricing.id,
            })

          if (!insertedPricing) {
            throw new Error("Failed to create plan pricing option")
          }

          touchedPricingIds.push(insertedPricing.id)
          syncTargets.push({
            id: insertedPricing.id,
            durationDays: option.durationDays,
            priceUsdCents: option.priceUsdCents,
            dodoProductId: null,
          })
        }

        const toDisable = existingPricing
          .map((x) => x.id)
          .filter((id) => !touchedPricingIds.includes(id))

        if (toDisable.length > 0) {
          await tx
            .update(planPricing)
            .set({ isActive: false })
            .where(
              and(
                eq(planPricing.planId, planId),
                inArray(planPricing.id, toDisable)
              )
            )
        }

        for (const pricing of syncTargets) {
          const syncResult = await syncDodoProductForPlanPricing({
            planPricingId: pricing.id,
            planName: body.name,
            durationDays: pricing.durationDays,
            priceUsdCents: pricing.priceUsdCents,
            existingDodoProductId: pricing.dodoProductId,
          })

          await tx
            .update(planPricing)
            .set({
              dodoProductId: syncResult.dodoProductId,
              dodoSyncStatus: "synced",
              dodoSyncError: null,
              dodoSyncedAt: syncResult.syncedAt,
            })
            .where(eq(planPricing.id, pricing.id))
        }
      })

      return {
        message: "Plan updated successfully",
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
