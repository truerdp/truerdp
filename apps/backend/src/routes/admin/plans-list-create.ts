import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { planPricing, plans } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { listAdminPlansWithPricing } from "../../services/plan.js"
import { getErrorMessage } from "../../utils/error.js"
import { createPlanSchema } from "./shared.js"
import {
  syncPlanPricingToDodo,
  type PlanPricingSyncTarget,
} from "./dodo-sync.js"

export async function registerAdminPlansListCreateRoutes(
  server: FastifyInstance
) {
  server.get(
    "/admin/plans",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await listAdminPlansWithPricing()
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/admin/plans",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = createPlanSchema.parse(request.body)
        const uniqueDurations = new Set(
          body.pricingOptions.map((x) => x.durationDays)
        )

        if (uniqueDurations.size !== body.pricingOptions.length) {
          return reply.status(400).send({
            error: "Pricing durations must be unique per plan",
          })
        }

        const created = await db.transaction(async (tx) => {
          const [plan] = await tx
            .insert(plans)
            .values({
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
            })
            .returning({
              id: plans.id,
            })

          if (!plan) {
            throw new Error("Failed to create plan")
          }

          await tx
            .insert(planPricing)
            .values(
              body.pricingOptions.map((option) => ({
                planId: plan.id,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                isActive: option.isActive,
              }))
            )
            .returning({
              id: planPricing.id,
              durationDays: planPricing.durationDays,
              priceUsdCents: planPricing.priceUsdCents,
              dodoProductId: planPricing.dodoProductId,
            })

          const insertedPricing = await tx
            .select({
              id: planPricing.id,
              durationDays: planPricing.durationDays,
              priceUsdCents: planPricing.priceUsdCents,
              dodoProductId: planPricing.dodoProductId,
            })
            .from(planPricing)
            .where(eq(planPricing.planId, plan.id))

          return {
            plan,
            syncTargets: insertedPricing.map(
              (pricing): PlanPricingSyncTarget => ({
                id: pricing.id,
                planName: body.name,
                durationDays: pricing.durationDays,
                priceUsdCents: pricing.priceUsdCents,
                dodoProductId: pricing.dodoProductId,
              })
            ),
          }
        })

        const syncResults = await Promise.all(
          created.syncTargets.map((pricing) => syncPlanPricingToDodo(pricing))
        )
        const failedSyncCount = syncResults.filter(
          (result) => result.status === "failed"
        ).length

        return {
          message:
            failedSyncCount > 0
              ? "Plan created, but Dodo product sync needs retry"
              : "Plan created successfully",
          planId: created.plan.id,
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
