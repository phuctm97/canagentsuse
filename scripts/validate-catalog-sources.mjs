import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const errors = []

if (!existsSync(join(repoRoot, "data/taxonomy.json"))) {
  errors.push("data/taxonomy.json is missing")
}

if (!existsSync(join(repoRoot, "data/tools"))) {
  errors.push("data/tools is missing")
}

const trackedCatalog = git(["ls-files", "data/catalog.json"]).trim()
if (trackedCatalog) {
  errors.push("data/catalog.json is generated and must not be tracked")
}

if (errors.length > 0) {
  console.error("Catalog source validation failed:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log("Catalog source validation passed.")

function git(args) {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" })
  } catch {
    return ""
  }
}
