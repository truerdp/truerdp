import { existsSync, copyFileSync, mkdirSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { delimiter, dirname, join } from "node:path"

const root = process.cwd()
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const requiredPnpmVersion =
  packageJson.packageManager?.match(/^pnpm@(.+)$/)?.[1] ?? null
const backendAgentConfig = "deploy/infisical/runtime/backend-agent.yaml"
const backendAgentConfigExample = "deploy/infisical/backend-agent.yaml.example"
const infisicalAuthUrl =
  "https://app.infisical.com/api/v1/auth/universal-auth/login"
const infisicalMachineIdentityFiles = [
  "/etc/infisical/truerdp/client-id",
  "/etc/infisical/truerdp/client-secret",
]

const command = process.argv[2]

const commands = {
  dev: runDev,
  "dev:backend": runDevBackend,
  "dev:backend:restart": runDevBackendRestart,
  "dev:backend:rebuild": runDevBackendRebuild,
  "dev:frontend": runDevFrontend,
  "dev:frontend:no-infisical": runDevFrontendWithoutInfisical,
  "dev:no-infisical": runDevWithoutInfisical,
  "dev:stop": runDevStop,
  "prod:backend:preflight": runProdBackendPreflight,
  "prod:backend": runProdBackend,
  "prod:backend:refresh": runProdBackendRefresh,
  doctor: runDoctor,
}

if (!command || !commands[command]) {
  console.error(
    [
      "Usage: node scripts/workflow.mjs <command>",
      "",
      "Commands:",
      "  dev                       Start local DB/backend Docker and frontend apps",
      "  dev:backend               Start local DB/backend Docker without rebuilding",
      "  dev:backend:restart       Restart the existing backend container",
      "  dev:backend:rebuild       Rebuild and recreate local DB/backend Docker",
      "  dev:frontend              Start frontend apps with Infisical when available",
      "  dev:frontend:no-infisical Start frontend apps from local shell/.env only",
      "  dev:stop                  Stop local Docker and frontend ports",
      "  prod:backend:preflight    Check production backend deploy prerequisites",
      "  prod:backend              Render Infisical backend env and deploy backend",
      "  prod:backend:refresh      Re-render backend env and recreate backend",
      "  doctor                    Check local workflow prerequisites",
    ].join("\n")
  )
  process.exit(1)
}

await commands[command]()

async function runDev() {
  ensureDevEnvFiles()

  if (canUseInfisical()) {
    syncLocalBackendEnvFromInfisical()
    await startLocalBackend()
    runDevFrontendWithInfisical()
    return
  }

  console.log(
    "Infisical is not configured for this shell; using local .env files."
  )
  await runDevWithoutInfisical()
}

function syncLocalBackendEnvFromInfisical() {
  run("infisical", [
    "export",
    "--env=dev",
    "--path=/",
    "--format=dotenv",
    "--output-file=apps/backend/.env",
  ])
}

async function runDevWithoutInfisical() {
  ensureDevEnvFiles()
  await startLocalBackend()
  runDevFrontendWithoutInfisical()
}

function runDevFrontend() {
  if (canUseInfisical()) {
    runDevFrontendWithInfisical()
    return
  }

  console.log(
    "Infisical is not configured for this shell; using local frontend env."
  )
  runDevFrontendWithoutInfisical()
}

function runDevFrontendWithInfisical() {
  ensureDevEnvFiles()
  run("infisical", [
    "run",
    "--env=dev",
    "--path=/",
    "--",
    process.execPath,
    "scripts/workflow.mjs",
    "dev:frontend:no-infisical",
  ])
}

function runDevFrontendWithoutInfisical() {
  ensureDevEnvFiles()
  const pnpm = getPnpmInfo()
  ensureFrontendDependencies(pnpm)

  run(
    pnpm.bin,
    [
      "exec",
      "turbo",
      "dev",
      "--filter=web",
      "--filter=dashboard",
      "--filter=admin",
      "--filter=cms",
    ],
    pnpm.env
  )
}

async function runDevBackend() {
  ensureDevEnvFiles()
  await startLocalBackend()
}

async function runDevBackendRestart() {
  ensureDevEnvFiles()

  run("docker", [
    "compose",
    "-f",
    "docker-compose.yml",
    "up",
    "-d",
    "db",
    "backend",
  ])

  run("docker", ["compose", "-f", "docker-compose.yml", "restart", "backend"])
  await waitForBackend()
}

async function runDevBackendRebuild() {
  ensureDevEnvFiles()
  await startLocalBackend({ build: true, forceRecreate: true })
}

function runDevStop() {
  run("docker", ["compose", "-f", "docker-compose.yml", "down"])

  const pnpm = findPnpmInfo({ quiet: true })
  const killPortBin = pnpm?.bin ?? "pnpm"
  const killPortEnv = pnpm?.env ?? {}

  run(
    killPortBin,
    ["exec", "kill-port", "3000", "3001", "3002", "3003", "3004"],
    killPortEnv,
    { allowFailure: true }
  )
}

async function startLocalBackend(options = {}) {
  const args = [
    "compose",
    "-f",
    "docker-compose.yml",
    "up",
    "-d",
    "db",
    "backend",
  ]

  if (options.forceRecreate) {
    args.splice(5, 0, "--force-recreate")
  }

  if (options.build) {
    args.splice(5, 0, "--build")
  }

  run("docker", args)
  await waitForBackend()
}

function runProdBackendPreflight() {
  ensureBackendAgentConfig()
  ensureProductionInfisicalReady()
  console.log("Production backend deploy prerequisites are present.")
}

function runProdBackend() {
  renderBackendEnv()
  run(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.prod.yml",
      "up",
      "-d",
      "--build",
      "--no-deps",
      "backend",
    ],
    {
      BACKEND_ENV_FILE: "apps/backend/.env.production.infisical",
    }
  )
}

function runProdBackendRefresh() {
  renderBackendEnv()
  run(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.prod.yml",
      "up",
      "-d",
      "--force-recreate",
      "--no-deps",
      "backend",
    ],
    {
      BACKEND_ENV_FILE: "apps/backend/.env.production.infisical",
    }
  )
}

function runDoctor() {
  const checks = [
    ["Node.js", "node", ["--version"]],
    ["pnpm", "pnpm", ["--version"]],
    ["Docker", "docker", ["--version"]],
    ["Docker Compose", "docker", ["compose", "version"]],
    ["ngrok", "ngrok", ["version"]],
  ]

  for (const [label, bin, args] of checks) {
    const result = spawnSync(bin, args, {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
    })

    if (result.status === 0) {
      console.log(`${label}: ${result.stdout.trim()}`)
    } else {
      console.log(`${label}: missing or not available`)
    }
  }

  console.log(
    `Infisical local auth: ${canUseInfisical() ? "available" : "not configured"}`
  )
  console.log(
    `Backend env: ${existsSync(join(root, "apps/backend/.env")) ? "present" : "missing; dev will copy the example"}`
  )
  console.log(
    `CMS env: ${existsSync(join(root, "apps/cms/.env")) ? "present" : "missing; dev will copy the example"}`
  )

  if (requiredPnpmVersion) {
    const pnpm = findPnpmInfo({ quiet: true })
    console.log(
      `pnpm required: ${requiredPnpmVersion}; selected: ${pnpm?.version ?? "not found"}`
    )
  }

  console.log(
    `Backend agent config: ${existsSync(join(root, backendAgentConfig)) ? "present" : "missing; prod commands will create it from the example"}`
  )
  console.log(
    `Infisical machine identity: ${infisicalMachineIdentityFiles.every((file) => existsSync(file)) ? "present" : "missing under /etc/infisical/truerdp"}`
  )
}

function ensureDevEnvFiles() {
  ensureLocalEnv("apps/backend/.env", "apps/backend/.env.example")
  ensureLocalEnv("apps/cms/.env", "apps/cms/.env.example")
}

function ensureLocalEnv(target, source) {
  const targetPath = join(root, target)

  if (existsSync(targetPath)) {
    return
  }

  copyFileSync(join(root, source), targetPath)
  console.log(`Created ${target} from ${source}.`)
}

function ensureFrontendDependencies(pnpm) {
  const missingNextBins = ["web", "dashboard", "admin", "cms"].filter(
    (app) =>
      !existsSync(
        join(root, "apps", app, "node_modules", "next", "dist", "bin", "next")
      )
  )

  if (missingNextBins.length === 0) {
    return
  }

  console.log(
    `Repairing workspace node_modules; missing Next.js links for: ${missingNextBins.join(", ")}.`
  )
  run(
    pnpm.bin,
    [
      "install",
      "--offline",
      "--frozen-lockfile",
      "--config.confirmModulesPurge=false",
    ],
    pnpm.env
  )
}

function findPnpmInfo(options = {}) {
  const candidates = getPnpmCandidates()
  const seen = new Set()

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) {
      continue
    }

    seen.add(candidate)

    const result = spawnSync(candidate, ["--version"], {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
    })

    if (result.status !== 0) {
      continue
    }

    const version = result.stdout.trim()

    if (!version) {
      continue
    }

    if (!requiredPnpmVersion || version === requiredPnpmVersion) {
      return {
        bin: candidate,
        version,
        env: buildPnpmEnv(candidate),
      }
    }

    if (!options.quiet) {
      console.warn(
        `Skipping pnpm ${version} at ${candidate}; repo requires pnpm ${requiredPnpmVersion}.`
      )
    }
  }

  return null
}

function getPnpmInfo() {
  const pnpm = findPnpmInfo()

  if (pnpm) {
    return pnpm
  }

  console.error(
    [
      `Unable to find pnpm ${requiredPnpmVersion ?? ""} on PATH.`.trim(),
      "Run `corepack prepare pnpm@10.29.3 --activate`, then retry.",
    ].join("\n")
  )
  process.exit(1)
}

function getPnpmCandidates() {
  const candidates = []

  if (process.env.npm_execpath?.toLowerCase().includes("pnpm")) {
    candidates.push(process.env.npm_execpath)
  }

  const where = process.platform === "win32" ? "where.exe" : "which"
  const result = spawnSync(where, ["pnpm"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  })

  if (result.status === 0) {
    candidates.push(
      ...result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
  }

  candidates.push("pnpm")
  return candidates
}

function buildPnpmEnv(bin) {
  const env = { ...process.env }
  const binDir =
    bin.includes("/") || bin.includes("\\") ? dirname(bin) : undefined

  if (binDir) {
    const pathKey =
      Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH"
    env[pathKey] = [binDir, env[pathKey]].filter(Boolean).join(delimiter)
  }

  env.COREPACK_ENABLE_DOWNLOAD_PROMPT = "0"
  return env
}

async function waitForBackend() {
  const timeoutMs = 90_000
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch("http://localhost:3003/")

      if (response.ok) {
        console.log("Backend is ready at http://localhost:3003")
        return
      }
    } catch {
      // Keep polling until Docker finishes starting Fastify.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }

  console.error(
    [
      "Backend did not become ready within 90 seconds.",
      "Inspect it with: docker compose -f docker-compose.yml logs -f backend",
    ].join("\n")
  )
  process.exit(1)
}

function renderBackendEnv() {
  const config = ensureBackendAgentConfig()
  ensureProductionInfisicalReady()

  run("infisical", ["agent", "--config", config])
}

function ensureBackendAgentConfig() {
  const runtimeDir = join(root, "deploy/infisical/runtime")
  const config = join(root, backendAgentConfig)
  const example = join(root, backendAgentConfigExample)

  if (existsSync(config)) {
    return config
  }

  if (!existsSync(example)) {
    console.error(
      [
        `Missing ${backendAgentConfigExample}.`,
        `Cannot create ${backendAgentConfig}.`,
      ].join(" ")
    )
    process.exit(1)
  }

  mkdirSync(runtimeDir, { recursive: true })
  copyFileSync(example, config)
  console.log(`Created ${backendAgentConfig} from the example.`)

  return config
}

function ensureProductionInfisicalReady() {
  if (!commandExists("infisical")) {
    console.error("Missing Infisical CLI. Install it on the production host.")
    process.exit(1)
  }

  const missingIdentityFiles = infisicalMachineIdentityFiles.filter(
    (file) => !existsSync(file)
  )

  if (missingIdentityFiles.length > 0) {
    console.error(
      [
        "Missing Infisical machine identity files:",
        ...missingIdentityFiles.map((file) => `- ${file}`),
        "Create them on the production host before running prod:backend.",
      ].join("\n")
    )
    process.exit(1)
  }

  validateInfisicalMachineIdentity()
}

function validateInfisicalMachineIdentity() {
  const [clientIdFile, clientSecretFile] = infisicalMachineIdentityFiles
  const clientId = readFileSync(clientIdFile, "utf8").trim()
  const clientSecret = readFileSync(clientSecretFile, "utf8").trim()

  if (!clientId || !clientSecret) {
    console.error("Infisical machine identity files must not be empty.")
    process.exit(1)
  }

  const result = spawnSync(
    "curl",
    [
      "--fail",
      "--silent",
      "--show-error",
      "--output",
      process.platform === "win32" ? "NUL" : "/dev/null",
      "--request",
      "POST",
      "--header",
      "Content-Type: application/json",
      "--data-binary",
      "@-",
      infisicalAuthUrl,
    ],
    {
      cwd: root,
      encoding: "utf8",
      input: JSON.stringify({
        clientId,
        clientSecret,
      }),
      shell: process.platform === "win32",
    }
  )

  if (result.status !== 0) {
    console.error(
      [
        "Infisical machine identity authentication failed.",
        "Check /etc/infisical/truerdp/client-id and client-secret.",
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n")
    )
    process.exit(result.status ?? 1)
  }
}

function canUseInfisical() {
  if (!commandExists("infisical")) {
    return false
  }

  if (process.env.INFISICAL_TOKEN) {
    return true
  }

  return existsSync(join(root, ".infisical.json"))
}

function commandExists(bin) {
  const result = spawnSync(bin, ["--version"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  })

  return result.status === 0
}

function run(bin, args, env = {}, options = {}) {
  const result = spawnSync(bin, args, {
    cwd: root,
    env: {
      ...process.env,
      ...env,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  })

  if (!options.allowFailure && result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
