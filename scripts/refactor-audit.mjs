import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const TARGET_ROOTS = ["apps", "packages"]
const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
])
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "coverage",
])

async function collectFiles(directory, files = []) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue
      }

      if (
        entryPath.includes(`${path.sep}drizzle${path.sep}meta${path.sep}`)
      ) {
        continue
      }

      await collectFiles(entryPath, files)
      continue
    }

    if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }

  return files
}

function countMatches(input, pattern) {
  const matches = input.match(pattern)
  return matches ? matches.length : 0
}

async function analyzeScope(scopePath) {
  const files = await collectFiles(scopePath)
  const metrics = {
    files: files.length,
    explicitAny: 0,
    over220LineFiles: [],
    over320LineFiles: [],
  }

  for (const file of files) {
    const content = await readFile(file, "utf8")
    const lines = content.split("\n").length
    const explicitAnyCount = countMatches(content, /\bany\b/g)

    metrics.explicitAny += explicitAnyCount

    if (lines > 220) {
      metrics.over220LineFiles.push({
        file: path.relative(ROOT, file),
        lines,
      })
    }

    if (lines > 320) {
      metrics.over320LineFiles.push({
        file: path.relative(ROOT, file),
        lines,
      })
    }
  }

  metrics.over220LineFiles.sort((a, b) => b.lines - a.lines)
  metrics.over320LineFiles.sort((a, b) => b.lines - a.lines)

  return metrics
}

function printSection(title, metrics) {
  console.log(`\n${title}`)
  console.log(`  files: ${metrics.files}`)
  console.log(`  explicit any: ${metrics.explicitAny}`)
  console.log(`  files over 220 lines: ${metrics.over220LineFiles.length}`)
  console.log(`  files over 320 lines: ${metrics.over320LineFiles.length}`)

  for (const file of metrics.over220LineFiles.slice(0, 8)) {
    console.log(`    - ${file.lines} ${file.file}`)
  }
}

async function main() {
  for (const rootDir of TARGET_ROOTS) {
    const absoluteRootDir = path.join(ROOT, rootDir)
    const entries = await readdir(absoluteRootDir, { withFileTypes: true })
    const scopedDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(absoluteRootDir, entry.name))

    console.log(`\n### ${rootDir}`)

    for (const scope of scopedDirs) {
      const metrics = await analyzeScope(scope)
      printSection(path.relative(ROOT, scope), metrics)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
