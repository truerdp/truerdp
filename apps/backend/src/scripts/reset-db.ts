import { config as loadEnv } from "dotenv"
import { client, closeDbConnection } from "../db.js"

const MIGRATIONS_TABLE = "__drizzle_migrations"

loadEnv({ path: ".env.production.local", override: false })
loadEnv({ path: ".env", override: false })

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function parseFlags(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    yes: argv.includes("--yes"),
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2))

  if (!flags.dryRun && !flags.yes) {
    throw new Error(
      "Missing --yes. Run with --dry-run first, then add --yes to execute the wipe."
    )
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }

  const tables = (await client.unsafe(
    `select tablename from pg_tables where schemaname = 'public' and tablename <> '${MIGRATIONS_TABLE}' order by tablename`
  )) as Array<{ tablename: string }>

  if (tables.length === 0) {
    console.log("No public tables to reset")
    return
  }

  const qualifiedTables = tables
    .map(
      ({ tablename }) =>
        `${quoteIdentifier("public")}.${quoteIdentifier(tablename)}`
    )
    .join(", ")

  if (flags.dryRun) {
    console.log(`Would truncate ${tables.length} tables:`)
    for (const { tablename } of tables) {
      console.log(`- public.${tablename}`)
    }
    return
  }

  await client.unsafe(
    `TRUNCATE TABLE ${qualifiedTables} RESTART IDENTITY CASCADE`
  )

  console.log(`Truncated ${tables.length} tables and reset identities`)
}

main()
  .catch((error) => {
    console.error("Database reset failed")
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDbConnection()
  })
