import type { HomeSectionsInput } from "@/components/landing/sections"

export type HomeContentOutput = Omit<
  HomeSectionsInput,
  | "displayClassName"
  | "plans"
  | "featuredPlans"
  | "cheapestOption"
  | "planCountLabel"
  | "uniqueLocations"
  | "uniqueTypes"
  | "plansByLocation"
>
