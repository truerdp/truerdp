export const DEFAULT_PASSWORD = "password123"

const DEFAULT_PLAN_PRICING = [
  {
    durationDays: 30,
    priceUsdCents: 500,
  },
  {
    durationDays: 90,
    priceUsdCents: 1299,
  },
  {
    durationDays: 180,
    priceUsdCents: 2399,
  },
] as const

export const DEFAULT_PLANS = [
  {
    name: "Starter RDP",
    cpu: 2,
    cpuName: "Intel Xeon E5",
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
    isFeatured: true,
    pricingOptions: DEFAULT_PLAN_PRICING,
  },
  {
    name: "Business RDP",
    cpu: 4,
    cpuName: "Intel Xeon Gold",
    cpuThreads: 4,
    ram: 8,
    ramType: "DDR4 ECC",
    storage: 160,
    storageType: "SSD",
    bandwidth: "4TB",
    os: "Windows",
    osVersion: "Windows Server 2022",
    planType: "Dedicated",
    portSpeed: "1Gbps",
    setupFees: 0,
    planLocation: "Germany",
    isFeatured: true,
    pricingOptions: [
      {
        durationDays: 30,
        priceUsdCents: 899,
      },
      {
        durationDays: 90,
        priceUsdCents: 2499,
      },
      {
        durationDays: 180,
        priceUsdCents: 4599,
      },
    ],
  },
  {
    name: "Performance RDP",
    cpu: 6,
    cpuName: "AMD EPYC",
    cpuThreads: 8,
    ram: 16,
    ramType: "DDR4 ECC",
    storage: 320,
    storageType: "SSD",
    bandwidth: "6TB",
    os: "Windows",
    osVersion: "Windows Server 2022 Datacenter",
    planType: "Dedicated",
    portSpeed: "2Gbps",
    setupFees: 0,
    planLocation: "Singapore",
    isFeatured: true,
    pricingOptions: [
      {
        durationDays: 30,
        priceUsdCents: 1499,
      },
      {
        durationDays: 90,
        priceUsdCents: 4099,
      },
      {
        durationDays: 365,
        priceUsdCents: 14999,
      },
    ],
  },
  {
    name: "Residential Basic",
    cpu: 2,
    cpuName: "Intel Core",
    cpuThreads: 2,
    ram: 4,
    ramType: "DDR4",
    storage: 60,
    storageType: "SSD",
    bandwidth: "1TB",
    os: "Windows",
    osVersion: "Windows 11 Pro",
    planType: "Residential",
    portSpeed: "500Mbps",
    setupFees: 0,
    planLocation: "India",
    isFeatured: false,
    pricingOptions: [
      {
        durationDays: 7,
        priceUsdCents: 299,
      },
      {
        durationDays: 30,
        priceUsdCents: 999,
      },
      {
        durationDays: 90,
        priceUsdCents: 2699,
      },
    ],
  },
  {
    name: "Residential Pro",
    cpu: 4,
    cpuName: "Intel Core i7",
    cpuThreads: 4,
    ram: 8,
    ramType: "DDR4",
    storage: 120,
    storageType: "SSD",
    bandwidth: "2TB",
    os: "Windows",
    osVersion: "Windows 11 Pro",
    planType: "Residential",
    portSpeed: "1Gbps",
    setupFees: 0,
    planLocation: "UK",
    isFeatured: true,
    pricingOptions: [
      {
        durationDays: 7,
        priceUsdCents: 499,
      },
      {
        durationDays: 30,
        priceUsdCents: 1699,
      },
      {
        durationDays: 90,
        priceUsdCents: 4599,
      },
    ],
  },
] as const

export type SeedPlan = (typeof DEFAULT_PLANS)[number]

