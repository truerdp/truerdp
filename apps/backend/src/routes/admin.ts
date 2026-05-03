import { FastifyInstance } from "fastify"

import { registerAdminPlansListCreateRoutes } from "./admin/plans-list-create.js"
import { registerAdminPlansUpdateRoutes } from "./admin/plans-update.js"
import { registerAdminPlansFlagsRoutes } from "./admin/plans-flags.js"
import { registerAdminCouponsListCreateRoutes } from "./admin/coupons-list-create.js"
import { registerAdminCouponsUpdateStatusRoutes } from "./admin/coupons-update-status.js"
import { registerAdminTransactionsConfirmRoutes } from "./admin/transactions-confirm.js"
import { registerAdminInstancesProvisionRoutes } from "./admin/instances-provision.js"
import { registerAdminInstancesTerminateRoutes } from "./admin/instances-terminate.js"
import { registerAdminInstancesSuspendUnsuspendRoutes } from "./admin/instances-suspend-unsuspend.js"
import { registerAdminInstancesExtendRoutes } from "./admin/instances-extend.js"
import { registerAdminUsersBillingRoutes } from "./admin/users-billing.js"
import { registerAdminInstancesQueryRoutes } from "./admin/instances-queries.js"
import { registerAdminServersStatsRoutes } from "./admin/servers-stats.js"

export async function adminRoutes(server: FastifyInstance) {
  await registerAdminPlansListCreateRoutes(server)
  await registerAdminPlansUpdateRoutes(server)
  await registerAdminPlansFlagsRoutes(server)
  await registerAdminCouponsListCreateRoutes(server)
  await registerAdminCouponsUpdateStatusRoutes(server)
  await registerAdminTransactionsConfirmRoutes(server)
  await registerAdminInstancesProvisionRoutes(server)
  await registerAdminInstancesTerminateRoutes(server)
  await registerAdminInstancesSuspendUnsuspendRoutes(server)
  await registerAdminInstancesExtendRoutes(server)
  await registerAdminUsersBillingRoutes(server)
  await registerAdminInstancesQueryRoutes(server)
  await registerAdminServersStatsRoutes(server)
}
