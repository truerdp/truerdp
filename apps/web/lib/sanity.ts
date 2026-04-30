import "server-only"

import { createClient } from "next-sanity"
import { defineLive } from "next-sanity/live"

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  process.env.SANITY_PROJECT_ID ??
  ""
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  process.env.SANITY_DATASET ??
  "production"
const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? "/studio"

export const sanityApiVersion =
  process.env.SANITY_API_VERSION ?? "2026-03-01"

export const isSanityConfigured = Boolean(projectId && dataset)

export const sanityClient = createClient({
  projectId: projectId || "missing-project-id",
  dataset,
  apiVersion: sanityApiVersion,
  useCdn: true,
  stega: {
    studioUrl,
  },
})

export const { sanityFetch, SanityLive } = defineLive({
  client: sanityClient,
  serverToken: process.env.SANITY_API_TOKEN || false,
  browserToken: process.env.SANITY_BROWSER_TOKEN || false,
})
