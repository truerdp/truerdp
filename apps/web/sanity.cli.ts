import { defineCliConfig } from "sanity/cli"

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  process.env.SANITY_PROJECT_ID ??
  "missing-project-id"
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  process.env.SANITY_DATASET ??
  "production"

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
})
