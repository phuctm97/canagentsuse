import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const baseRef = process.env.GITHUB_BASE_REF
  ? `origin/${process.env.GITHUB_BASE_REF}`
  : "origin/main"
const headRef = "HEAD"
const errors = []
const changedFiles = changedFilesFromBase(baseRef, headRef)
const toolSourceChanges = []

for (const change of changedFiles) {
  for (const file of change.files) {
    if (file === "data/catalog.json") {
      errors.push(
        "data/catalog.json is generated. Submit catalog changes in data/tools/<first-letter>/<slug>.json instead."
      )
      continue
    }

    if (file.startsWith("data/tools/")) {
      toolSourceChanges.push(file)
      validateToolSourcePath(file)
    }
  }
}

if (errors.length > 0) {
  console.error("Catalog PR validation failed:")
  for (const error of [...new Set(errors)]) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      changedFiles: changedFiles.length,
      toolSourceFiles: [...new Set(toolSourceChanges)].length,
      generatedCatalogChanged: changedFiles.some((change) =>
        change.files.includes("data/catalog.json")
      ),
    },
    null,
    2
  )
)
console.log("Catalog PR validation passed.")

function changedFilesFromBase(base, head) {
  const mergeBase = git(["merge-base", base, head]).trim()
  const diffBase = mergeBase || `${head}^`
  const output = git(["diff", "--name-status", `${diffBase}...${head}`])

  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t")
      const status = parts[0]

      return {
        status,
        files: status.startsWith("R") || status.startsWith("C") ? [parts[2]] : [parts[1]],
      }
    })
}

function validateToolSourcePath(file) {
  if (!file.endsWith(".json")) {
    errors.push(`${file}: tool source files must be JSON`)
    return
  }

  const parts = file.split("/")
  if (parts.length !== 4) {
    errors.push(`${file}: expected data/tools/<first-letter>/<slug>.json`)
    return
  }

  const bucket = parts[2]
  const slug = parts[3].replace(/\.json$/, "")
  const expectedBucket = sourceFolderForSlug(slug)

  if (bucket !== expectedBucket) {
    errors.push(`${file}: expected data/tools/${expectedBucket}/${slug}.json`)
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`${file}: filename slug must be lowercase kebab-case`)
    return
  }

  if (!["A", "M", "R", "C"].includes(fileStatus(file).charAt(0))) {
    return
  }

  try {
    const tool = JSON.parse(readFileSync(file, "utf8"))
    if (tool.slug !== slug) {
      errors.push(`${file}: tool.slug must be "${slug}"`)
    }
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function fileStatus(file) {
  const match = changedFiles.find((change) => change.files.includes(file))
  return match?.status ?? ""
}

function sourceFolderForSlug(slug) {
  const first = slug.charAt(0)

  return /^[a-z]$/.test(first) ? first : "0-9"
}

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
  } catch {
    return ""
  }
}
