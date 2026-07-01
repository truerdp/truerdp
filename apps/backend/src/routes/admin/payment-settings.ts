import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import {
  getPaymentSettings,
  paymentSettingsInputSchema,
} from "../../services/billing.js"
import { updatePaymentSettings } from "../../services/payment-settings.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  getAdminPaymentSettingsSchema,
  updateAdminPaymentSettingsSchema,
} from "../../schemas/payment-settings.schemas.js"

export async function registerAdminPaymentSettingsRoutes(
  server: FastifyInstance
) {
  server.get(
    "/admin/payment-settings",
    { preHandler: verifyAuth, schema: getAdminPaymentSettingsSchema },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await getPaymentSettings()
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.put(
    "/admin/payment-settings",
    { preHandler: verifyAuth, schema: updateAdminPaymentSettingsSchema },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const previous = await getPaymentSettings()
        const body = paymentSettingsInputSchema.parse(request.body)
        const updated = await updatePaymentSettings(body)

        await createAdminAuditLog({
          adminUserId: request.user?.userId,
          action: "payment_settings.updated",
          entityType: "payment_settings",
          entityId: updated.id,
          reason: "Admin updated payment settings",
          beforeState: {
            upiEnabled: previous.upiEnabled,
            usdtTrc20Enabled: previous.usdtTrc20Enabled,
            dodoCheckoutEnabled: previous.dodoCheckoutEnabled,
            coingateCheckoutEnabled: previous.coingateCheckoutEnabled,
            paypalCheckoutEnabled: previous.paypalCheckoutEnabled,
            usdtTrc20WalletAddress: previous.usdtTrc20WalletAddress,
            usdtTrc20QrCodeImageUrl: previous.usdtTrc20QrCodeImageUrl,
          },
          afterState: {
            upiEnabled: updated.upiEnabled,
            usdtTrc20Enabled: updated.usdtTrc20Enabled,
            dodoCheckoutEnabled: updated.dodoCheckoutEnabled,
            coingateCheckoutEnabled: updated.coingateCheckoutEnabled,
            paypalCheckoutEnabled: updated.paypalCheckoutEnabled,
            usdtTrc20WalletAddress: updated.usdtTrc20WalletAddress,
            usdtTrc20QrCodeImageUrl: updated.usdtTrc20QrCodeImageUrl,
          },
        })

        return {
          message: "Payment settings updated",
          settings: updated,
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
