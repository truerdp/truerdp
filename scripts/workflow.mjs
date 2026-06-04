import { existsSync, copyFileSync, mkdirSync } from "node:fs"
import { spawn, spawnSync } from "node:child_process"
import { join } from "node:path"

const root = process.cwd()
const backendAgentConfig = "deploy/infisical/runtime/backend-agent.yaml"
const backendAgentConfigExample = "deploy/infisical/backend-agent.yaml.example"
const infisicalMachineIdentityFiles = [
  "/etc/infisical/truerdp/client-id",
  "/etc/infisical/truerdp/client-secret",
]

const command = process.argv[2]

const commands = {
  dev: runDev,
  "dev:no-infisical": runDevWithoutInfisical,
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
      "  dev                   Start local DB/backend Docker and frontend apps",
      "  prod:backend:preflight Check production backend deploy prerequisites",
      "  prod:backend          Render Infisical backend env and deploy backend",
      "  prod:backend:refresh  Re-render Infisical env and recreate backend",
      "  doctor                Check local workflow prerequisites",
    ].join("\n")
  )
  process.exit(1)
}

commands[command]()

function runDev() {
  ensureLocalEnv("apps/backend/.env", "apps/backend/.env.example")

  if (canUseInfisical()) {
    run("infisical", [
      "run",
      "--path=/shared",
      "--path=/backend",
      "--path=/web",
      "--path=/dashboard",
      "--path=/admin",
      "--path=/cms",
      "--",
      "node",
      "scripts/workflow.mjs",
      "dev:no-infisical",
    ])
    return
  }

  console.log(
    "Infisical is not configured for this shell; using local .env files."
  )
  runDevWithoutInfisical()
}

function runDevWithoutInfisical() {
  ensureLocalEnv("apps/backend/.env", "apps/backend/.env.example")
  run("docker", [
    "compose",
    "-f",
    "docker-compose.yml",
    "up",
    "-d",
    "--build",
    "backend",
    "db",
  ])
  startBackendTunnel()
  run("pnpm", ["run", "dev:frontend"])
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
    `Backend agent config: ${existsSync(join(root, backendAgentConfig)) ? "present" : "missing; prod commands will create it from the example"}`
  )
  console.log(
    `Infisical machine identity: ${infisicalMachineIdentityFiles.every((file) => existsSync(file)) ? "present" : "missing under /etc/infisical/truerdp"}`
  )
}

function ensureLocalEnv(target, source) {
  const targetPath = join(root, target)

  if (existsSync(targetPath)) {
    return
  }

  copyFileSync(join(root, source), targetPath)
  console.log(`Created ${target} from ${source}.`)
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

function startBackendTunnel() {
  if (process.env.TRUERDP_SKIP_TUNNEL === "true") {
    console.log("Skipping backend tunnel because TRUERDP_SKIP_TUNNEL=true.")
    return
  }

  if (!commandExists("ngrok")) {
    console.log("ngrok is not available; continuing without a backend tunnel.")
    return
  }

  const child = spawn("ngrok", ["http", "3003"], {
    cwd: root,
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  })

  const stopTunnel = () => {
    if (!child.killed) {
      child.kill()
    }
  }

  process.once("exit", stopTunnel)
  process.once("SIGINT", () => {
    stopTunnel()
    process.exit(130)
  })
  process.once("SIGTERM", () => {
    stopTunnel()
    process.exit(143)
  })
}

function run(bin, args, env = {}) {
  const result = spawnSync(bin, args, {
    cwd: root,
    env: {
      ...process.env,
      ...env,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
