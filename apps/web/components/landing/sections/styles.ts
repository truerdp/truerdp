import { webPaths } from "@/lib/paths"
import type { FooterColumn, Plan, PlanPricingOption } from "./types"

export const valuePropStyles = [
  {
    icon: "bg-[oklch(0.93_0.08_205)] text-[oklch(0.34_0.11_212)]",
    card: "border-[oklch(0.8_0.08_205)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_205),oklch(0.95_0.04_205))] dark:bg-[linear-gradient(150deg,oklch(0.24_0.055_218),oklch(0.17_0.035_250))]",
  },
  {
    icon: "bg-[oklch(0.94_0.065_78)] text-[oklch(0.43_0.12_66)]",
    card: "border-[oklch(0.84_0.075_78)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_84),oklch(0.96_0.035_78))] dark:bg-[linear-gradient(150deg,oklch(0.24_0.052_70),oklch(0.17_0.035_250))]",
  },
  {
    icon: "bg-[oklch(0.93_0.075_166)] text-[oklch(0.32_0.105_166)]",
    card: "border-[oklch(0.8_0.08_166)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_166),oklch(0.95_0.04_166))] dark:bg-[linear-gradient(150deg,oklch(0.22_0.055_166),oklch(0.17_0.035_250))]",
  },
]

export const planCardStyles = [
  "border-[oklch(0.82_0.075_205)]/70 bg-[linear-gradient(160deg,oklch(1_0_0),oklch(0.96_0.032_205))] dark:bg-[linear-gradient(160deg,oklch(0.23_0.052_218),oklch(0.17_0.035_250))]",
  "border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(160deg,oklch(1_0_0),oklch(0.965_0.03_78))] dark:bg-[linear-gradient(160deg,oklch(0.23_0.048_72),oklch(0.17_0.035_250))]",
  "border-[oklch(0.82_0.075_166)]/70 bg-[linear-gradient(160deg,oklch(1_0_0),oklch(0.96_0.032_166))] dark:bg-[linear-gradient(160deg,oklch(0.21_0.052_166),oklch(0.17_0.035_250))]",
]

export const statCardClass =
  "rounded-2xl border border-white/80 bg-white/75 px-3 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8"

export const sectionEyebrowClass =
  "text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]"

export function getLowestPricingOption(plan: Plan): PlanPricingOption | null {
  if (plan.pricingOptions.length === 0) {
    return null
  }

  return (
    [...plan.pricingOptions].sort(
      (a, b) => a.priceUsdCents - b.priceUsdCents
    )[0] ?? null
  )
}

export const defaultFooterColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Plans", href: webPaths.plans },
      { label: "Pricing", href: webPaths.plans },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: webPaths.faq },
      { label: "Contact", href: webPaths.contact },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: webPaths.terms },
      { label: "Privacy", href: webPaths.privacy },
      { label: "Refund Policy", href: webPaths.refundPolicy },
    ],
  },
]
