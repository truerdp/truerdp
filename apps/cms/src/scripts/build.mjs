import { spawnSync } from "node:child_process"
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

function shouldRunMigrations() {
  if (process.env.PAYLOAD_RUN_MIGRATIONS_ON_BUILD === "true") {
    return true
  }

  return (
    process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production"
  )
}

runStep(payloadCommand, ["generate:importmap"], "payload generate:importmap")

if (shouldRunMigrations()) {
  runStep(payloadCommand, ["migrate"], "payload migrate")
}

runStep(nextCommand, ["build"], "next build")
