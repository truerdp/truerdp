import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"

const appDependencies = {
  admin: [
    "apps/admin/",
    "packages/api/",
    "packages/brand-assets/",
    "packages/typescript-config/",
    "packages/ui/",
  ],
  cms: ["apps/cms/", "packages/typescript-config/"],
  dashboard: [
    "apps/dashboard/",
    "packages/api/",
    "packages/brand-assets/",
    "packages/typescript-config/",
    "packages/ui/",
  ],
  web: [
    "apps/web/",
    "packages/api/",
    "packages/brand-assets/",
    "packages/typescript-config/",
    "packages/ui/",
  ],
}

const globalBuildInputs = new Set([
  ".npmrc",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts/vercel-ignore.mjs",
  "turbo.json",
])

function runGit(args) {
  const repoRoot = findRepoRoot()

  const safeRepoRoot = normalizePath(repoRoot)

  return spawnSync("git", ["-c", `safe.directory=${safeRepoRoot}`, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  })
}

function findRepoRoot() {
  let current = process.cwd()

  while (true) {
    const parsed = path.parse(current)

    if (existsSync(path.join(current, ".git"))) {
      return current
    }

    if (current === parsed.root) {
      return process.cwd()
    }

    current = path.dirname(current)
  }
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "")
}

function inferAppName() {
  const explicitName = process.argv[2]

  if (explicitName) {
    return explicitName
  }

  const projectName = process.env.VERCEL_PROJECT_NAME?.toLowerCase()

  if (projectName) {
    for (const name of Object.keys(appDependencies)) {
      if (projectName === name || projectName.endsWith(`-${name}`)) {
        return name
      }
    }
  }

  const cwdName = path.basename(process.cwd()).toLowerCase()
  return appDependencies[cwdName] ? cwdName : null
}

function getDiffRange() {
  const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD"
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA

  if (previous && !/^0+$/.test(previous)) {
    return [previous, head]
  }

  return ["HEAD~1", head]
}

function getChangedPaths() {
  const diff = runGit(["diff", "--name-only", ...getDiffRange(), "--"])

  if (diff.status !== 0) {
    console.error(diff.stderr.trim() || "Unable to inspect git diff")
    return null
  }

  return diff.stdout
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean)
}

const appName = inferAppName()

if (!appName || !appDependencies[appName]) {
  console.error("Unable to determine Vercel app name; continuing build.")
  process.exit(1)
}

const changedPaths = getChangedPaths()

if (!changedPaths) {
  process.exit(1)
}

const relevantPrefixes = appDependencies[appName]
const shouldBuild = changedPaths.some((changedPath) => {
  if (globalBuildInputs.has(changedPath)) {
    return true
  }

  return relevantPrefixes.some((prefix) => changedPath.startsWith(prefix))
})

if (shouldBuild) {
  console.log(`[vercel-ignore] Building ${appName}; relevant files changed.`)
  process.exit(1)
}

console.log(`[vercel-ignore] Skipping ${appName}; no relevant files changed.`)
process.exit(0)
