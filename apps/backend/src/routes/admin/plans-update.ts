import { FastifyInstance } from "fastify"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "../../db.js"
import { planPricing, plans } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import { updatePlanSchema } from "./shared.js"
import {
  syncPlanPricingToDodo,
  type PlanPricingSyncTarget,
} from "./dodo-sync.js"

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
        const uniqueDurations = new Set(
          body.pricingOptions.map((x) => x.durationDays)
        )
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

        const syncTargets = await db.transaction(async (tx) => {
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
              promoPriceUsdCents: planPricing.promoPriceUsdCents,
              dodoProductId: planPricing.dodoProductId,
            })
            .from(planPricing)
            .where(eq(planPricing.planId, planId))

          const existingById = new Map(existingPricing.map((x) => [x.id, x]))
          const existingByDuration = new Map(
            existingPricing.map((x) => [x.durationDays, x])
          )
          const touchedPricingIds: number[] = []
          const nextSyncTargets: PlanPricingSyncTarget[] = []

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
                  promoPriceUsdCents: option.promoPriceUsdCents ?? null,
                  isActive: option.isActive,
                  dodoSyncStatus: "pending",
                  dodoSyncError: null,
                })
                .where(eq(planPricing.id, option.id))

              touchedPricingIds.push(option.id)
              nextSyncTargets.push({
                id: option.id,
                planName: body.name,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                promoPriceUsdCents: option.promoPriceUsdCents ?? null,
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
                  promoPriceUsdCents: option.promoPriceUsdCents ?? null,
                  isActive: option.isActive,
                  dodoSyncStatus: "pending",
                  dodoSyncError: null,
                })
                .where(eq(planPricing.id, matchedByDuration.id))

              touchedPricingIds.push(matchedByDuration.id)
              nextSyncTargets.push({
                id: matchedByDuration.id,
                planName: body.name,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                promoPriceUsdCents: option.promoPriceUsdCents ?? null,
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
                promoPriceUsdCents: option.promoPriceUsdCents ?? null,
                isActive: option.isActive,
              })
              .returning({
                id: planPricing.id,
              })

            if (!insertedPricing) {
              throw new Error("Failed to create plan pricing option")
            }

            touchedPricingIds.push(insertedPricing.id)
            nextSyncTargets.push({
              id: insertedPricing.id,
              planName: body.name,
              durationDays: option.durationDays,
              priceUsdCents: option.priceUsdCents,
              promoPriceUsdCents: option.promoPriceUsdCents ?? null,
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

          return nextSyncTargets
        })

        const syncResults = await Promise.all(
          syncTargets.map((pricing) => syncPlanPricingToDodo(pricing))
        )
        const failedSyncCount = syncResults.filter(
          (result) => result.status === "failed"
        ).length

        return {
          message:
            failedSyncCount > 0
              ? "Plan updated, but Dodo product sync needs retry"
              : "Plan updated successfully",
          dodoSync: {
            failed: failedSyncCount,
            total: syncResults.length,
          },
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
