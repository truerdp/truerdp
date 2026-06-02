import "dotenv/config"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const outDir = resolve(process.cwd(), "../../backups/cms")
mkdirSync(outDir, { recursive: true })

const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-")
const sql = postgres(connectionString)

try {
  const [cmsPages, emailTemplates] = await Promise.all([
    sql`select * from cms_pages order by slug`.catch(() => []),
    sql`select * from email_templates order by key`.catch(() => []),
  ])

  const outPath = resolve(outDir, `legacy-cms-${stamp}.json`)
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        cmsPages,
        emailTemplates,
      },
      null,
      2
    )
  )

  console.log(`Legacy CMS backup written to ${outPath}`)
} finally {
  await sql.end()
}
