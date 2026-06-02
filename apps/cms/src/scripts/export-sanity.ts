import "dotenv/config"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"
const token = process.env.SANITY_API_TOKEN

if (!projectId) {
  throw new Error("SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID is required")
}

const query = encodeURIComponent("*[]")
const url = `https://${projectId}.api.sanity.io/v2026-03-01/data/query/${dataset}?query=${query}`
const response = await fetch(url, {
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
})

if (!response.ok) {
  throw new Error(`Sanity export failed (${response.status})`)
}

const payload = await response.json()
const outDir = resolve(process.cwd(), "../../backups/cms")
mkdirSync(outDir, { recursive: true })

const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-")
const outPath = resolve(outDir, `sanity-${stamp}.json`)
writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log(`Sanity export written to ${outPath}`)
