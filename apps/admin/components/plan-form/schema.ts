import z from "zod"

function toPriceUsd(priceUsdCents: number) {
  return priceUsdCents / 100
}

export const planFormSchema = z
  .object({
    name: z.string().trim().min(1, "Plan name is required"),
    cpu: z.number().int().positive("CPU must be greater than 0"),
    cpuName: z.string().trim().min(1, "CPU name is required"),
    cpuThreads: z.number().int().positive("CPU threads must be greater than 0"),
    ram: z.number().int().positive("RAM must be greater than 0"),
    ramType: z.string().trim().min(1, "RAM type is required"),
    storage: z.number().int().positive("Storage must be greater than 0"),
    storageType: z.enum(["HDD", "SSD"]),
    bandwidth: z.string().trim().min(1, "Bandwidth is required"),
    os: z.string().trim().min(1, "OS is required"),
    osVersion: z.string().trim().min(1, "OS version is required"),
    planType: z.enum(["Dedicated", "Residential"]),
    portSpeed: z.string().trim().min(1, "Port speed is required"),
    setupFees: z.number().int().nonnegative("Setup fees cannot be negative"),
    planLocation: z.string().trim().min(1, "Plan location is required"),
    defaultPricingId: z.number().int().positive().optional().nullable(),
    pricingOptions: z
      .array(
        z.object({
          pricingId: z.number().int().positive().optional(),
          durationDays: z
            .number()
            .int()
            .positive("Duration must be greater than 0"),
          priceUsd: z.number().nonnegative("Price cannot be negative"),
          isActive: z.boolean(),
        })
      )
      .min(1, "At least one pricing option is required"),
  })
  .superRefine((value, context) => {
    const seenDurations = new Set<number>()

    value.pricingOptions.forEach((option, index) => {
      if (seenDurations.has(option.durationDays)) {
        context.addIssue({
          code: "custom",
          path: ["pricingOptions", index, "durationDays"],
          message: "Each pricing duration must be unique",
        })
      }

      seenDurations.add(option.durationDays)
    })
  })

export type PlanFormValues = z.infer<typeof planFormSchema>

export const defaultPlanFormValues: PlanFormValues = {
  name: "",
  cpu: 2,
  cpuName: "Intel Xeon",
  cpuThreads: 2,
  ram: 4,
  ramType: "DDR4",
  storage: 80,
  storageType: "SSD",
  bandwidth: "2TB",
  os: "Windows",
  osVersion: "Windows Server 2022",
  planType: "Dedicated",
  portSpeed: "1Gbps",
  setupFees: 0,
  planLocation: "USA",
  defaultPricingId: null,
  pricingOptions: [
    {
      durationDays: 30,
      priceUsd: toPriceUsd(500),
      pricingId: undefined,
      isActive: true,
    },
  ],
}
