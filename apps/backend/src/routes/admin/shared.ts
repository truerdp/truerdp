import z from "zod"
import { db } from "../../db.js"
import { instanceStatusEvents, instances } from "../../schema.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"

export const provisionSchema = z.object({
  serverId: z.number().int().positive(),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1).optional(),
  reason: z.string().trim().min(3).max(500).optional(),
})

export const extendInstanceSchema = z.object({
  days: z.number().int().positive(),
})

export const reasonSchema = z.object({
  reason: z.string().trim().min(3).max(500),
})

export const optionalReasonSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
})

const optionalBillingFieldSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
  })

export const adminBillingDetailsUpdateSchema = z.object({
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().min(1),
  companyName: optionalBillingFieldSchema,
  taxId: optionalBillingFieldSchema,
  addressLine1: z.string().trim().min(1),
  addressLine2: optionalBillingFieldSchema,
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(500),
})

export const adminUserProfileUpdateSchema = z.object({
  role: z.enum(["user", "operator", "admin"]),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`)
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value &&
        parsed < new Date()
      )
    }, "Enter a valid date of birth")
    .nullable(),
  reason: z.string().trim().min(3).max(500),
})

const planPricingInputBaseSchema = z.object({
  id: z.number().int().positive().optional(),
  durationDays: z.number().int().positive(),
  priceUsdCents: z.number().int().nonnegative(),
  promoPriceUsdCents: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().default(true),
})

function hasValidPromoPrice(value: {
  priceUsdCents: number
  promoPriceUsdCents?: number | null
}) {
  return (
    value.promoPriceUsdCents == null ||
    value.promoPriceUsdCents < value.priceUsdCents
  )
}

export const planPricingInputSchema = planPricingInputBaseSchema.refine(
  (value) => hasValidPromoPrice(value),
  {
    message: "Promo price must be lower than regular price",
    path: ["promoPriceUsdCents"],
  }
)

const createPlanPricingInputSchema = planPricingInputBaseSchema
  .omit({ id: true })
  .refine((value) => hasValidPromoPrice(value), {
    message: "Promo price must be lower than regular price",
    path: ["promoPriceUsdCents"],
  })

export const createPlanSchema = z.object({
  name: z.string().trim().min(1),
  cpu: z.number().int().positive(),
  cpuName: z.string().trim().min(1).default("Intel Xeon"),
  cpuThreads: z.number().int().positive().default(2),
  ram: z.number().int().positive(),
  ramType: z.string().trim().min(1).default("DDR4"),
  storage: z.number().int().positive(),
  storageType: z.enum(["HDD", "SSD"]).default("SSD"),
  bandwidth: z.string().trim().min(1).default("2TB"),
  os: z.string().trim().min(1).default("Windows"),
  osVersion: z.string().trim().min(1).default("Windows Server 2022"),
  planType: z.enum(["Dedicated", "Residential"]).default("Dedicated"),
  portSpeed: z.string().trim().min(1).default("1Gbps"),
  setupFees: z.number().int().nonnegative().default(0),
  planLocation: z.string().trim().min(1).default("USA"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  pricingOptions: z.array(createPlanPricingInputSchema).min(1),
})

export const updatePlanSchema = z.object({
  name: z.string().trim().min(1),
  cpu: z.number().int().positive(),
  cpuName: z.string().trim().min(1),
  cpuThreads: z.number().int().positive(),
  ram: z.number().int().positive(),
  ramType: z.string().trim().min(1),
  storage: z.number().int().positive(),
  storageType: z.enum(["HDD", "SSD"]),
  bandwidth: z.string().trim().min(1),
  os: z.string().trim().min(1),
  osVersion: z.string().trim().min(1),
  planType: z.enum(["Dedicated", "Residential"]),
  portSpeed: z.string().trim().min(1),
  setupFees: z.number().int().nonnegative(),
  planLocation: z.string().trim().min(1),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  defaultPricingId: z.number().int().positive().optional().nullable(),
  pricingOptions: z.array(planPricingInputSchema).min(1),
})

export const updatePlanStatusSchema = z.object({
  isActive: z.boolean(),
})

export const updatePlanFeaturedSchema = z.object({
  isFeatured: z.boolean(),
})

export const serverInputSchema = z.object({
  provider: z.string().trim().min(1).default("manual"),
  externalId: z.string().trim().min(1).nullable().optional(),
  ipAddress: z.string().trim().min(1),
  cpu: z.number().int().positive(),
  ram: z.number().int().positive(),
  storage: z.number().int().positive(),
  status: z
    .enum(["available", "assigned", "cleaning", "retired"])
    .default("available"),
})

export const serverStatusUpdateSchema = z.object({
  status: z.enum(["available", "assigned", "cleaning", "retired"]),
  reason: z.string().trim().min(3).max(500).optional(),
})

export const couponInputSchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    type: z.enum(["percent", "flat"]),
    value: z.number().int().positive(),
    appliesTo: z.enum(["all", "new_purchase", "renewal"]).default("all"),
    maxUses: z.number().int().positive().nullable().optional(),
    maxUsesPerCustomer: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.type !== "percent" || value.value <= 100, {
    message: "Percent coupon value must be 1-100",
    path: ["value"],
  })

export const couponStatusSchema = z.object({
  isActive: z.boolean(),
})

const adminListPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const adminAuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.coerce.number().int().positive().optional(),
  adminUserId: z.coerce.number().int().positive().optional(),
})

const expiryReminderRunSchema = z.object({
  daysAhead: z.number().int().min(1).max(30).optional(),
})

const adminInvoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  invoiceStatus: z.enum(["unpaid", "paid", "expired"]).optional(),
  transactionStatus: z
    .enum(["none", "pending", "confirmed", "failed"])
    .optional(),
  method: z
    .enum(["none", "upi", "usdt_trc20", "dodo_checkout", "coingate_checkout"])
    .optional(),
})

const adminWebhookEventListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["received", "processed", "ignored", "failed"]).optional(),
  provider: z.enum(["dodo", "coingate", "mock"]).optional(),
})

export const adminQuerySchemas = {
  adminListPaginationQuerySchema,
  adminAuditLogQuerySchema,
  expiryReminderRunSchema,
  adminInvoiceListQuerySchema,
  adminWebhookEventListQuerySchema,
}

export function getEffectiveRestoreStatus(expiryDate: Date | null) {
  return expiryDate && expiryDate < new Date() ? "expired" : "active"
}

export async function recordInstanceStatusEvent(input: {
  instanceId: number
  adminUserId: number
  action: "provision" | "extend" | "suspend" | "unsuspend" | "terminate"
  reason: string
  fromStatus: typeof instances.$inferSelect.status
  toStatus: typeof instances.$inferSelect.status
}) {
  await db.insert(instanceStatusEvents).values(input)
  await createAdminAuditLog({
    adminUserId: input.adminUserId,
    action: `instance.${input.action}`,
    entityType: "instance",
    entityId: input.instanceId,
    reason: input.reason,
    beforeState: {
      status: input.fromStatus,
    },
    afterState: {
      status: input.toStatus,
    },
  })
}
