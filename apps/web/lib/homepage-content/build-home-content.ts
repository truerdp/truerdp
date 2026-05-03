import { buildPrimaryHomeSections } from "@/lib/homepage-content/build-primary-sections"
import { buildSecondaryHomeSections } from "@/lib/homepage-content/build-secondary-sections"
import type { HomeContentOutput } from "@/lib/homepage-content/types"

export function buildHomeContent(
  cmsContent: Record<string, unknown>
): HomeContentOutput {
  const primary = buildPrimaryHomeSections(cmsContent)
  const secondary = buildSecondaryHomeSections(cmsContent)

  return {
    ...primary,
    ...secondary,
  }
}
