import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

const binDir = path.join(process.cwd(), "node_modules", ".bin")
const payloadCommand = path.join(
  binDir,
  process.platform === "win32" ? "payload.cmd" : "payload"
)
const nextCommand = path.join(
  binDir,
  process.platform === "win32" ? "next.cmd" : "next"
)
const importMapPath = path.join(
  process.cwd(),
  "app",
  "(payload)",
  "admin",
  "importMap.js"
)
const s3ImportSource = "@payloadcms/storage-s3/client"
const s3ImportName = "S3ClientUploadHandler_storageS3"
const s3ImportStatement = `import { S3ClientUploadHandler as ${s3ImportName} } from "${s3ImportSource}"`
const s3ImportMapKey =
  '"@payloadcms/storage-s3/client#S3ClientUploadHandler": ' + s3ImportName

function runStep(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  })

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}`)
  }
}

function ensureS3UploadHandlerImportMap() {
  const importMapContents = readFileSync(importMapPath, "utf8")

  if (importMapContents.includes(s3ImportMapKey)) {
    return
  }

  let nextContents = importMapContents

  if (!nextContents.includes(s3ImportStatement)) {
    nextContents = `${s3ImportStatement}\n${nextContents}`
  }

  nextContents = nextContents.replace(/\n}$/, `,\n  ${s3ImportMapKey}\n}`)

  if (!nextContents.includes(s3ImportMapKey)) {
    throw new Error("Failed to inject S3 client upload handler into import map")
  }

  writeFileSync(importMapPath, nextContents)
}

function shouldUseR2ClientUploads() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.R2_BUCKET?.trim()) &&
    Boolean(process.env.R2_ACCESS_KEY_ID?.trim()) &&
    Boolean(process.env.R2_SECRET_ACCESS_KEY?.trim()) &&
    Boolean(
      process.env.R2_ENDPOINT?.trim() || process.env.R2_ACCOUNT_ID?.trim()
    )
  )
}

function shouldRunMigrations() {
  if (process.env.PAYLOAD_RUN_MIGRATIONS_ON_BUILD === "true") {
    return true
  }

  return (
    process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production"
  )
}

runStep(payloadCommand, ["generate:importmap"], "payload generate:importmap")

if (shouldUseR2ClientUploads()) {
  ensureS3UploadHandlerImportMap()
}

if (shouldRunMigrations()) {
  runStep(payloadCommand, ["migrate"], "payload migrate")
}

runStep(nextCommand, ["build"], "next build")
