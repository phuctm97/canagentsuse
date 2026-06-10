import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const adoptionTiers = new Set([
  "category-leader",
  "major-platform",
  "established-platform",
  "established-product",
  "growing-product",
  "niche-tool",
  "early-tool",
])
const ecosystemImportanceValues = new Set([
  "core-platform",
  "business-critical",
  "developer-tooling",
  "specialized",
  "niche",
  "unknown",
])
const maturityValues = new Set(["active", "maintained", "unknown"])
const distributionValues = new Set(["auto", "none"])
const launchSignalKeys = [
  "adoptionTier",
  "ecosystemImportance",
  "githubStars",
  "packageDownloadsMonthly",
  "maturity",
  "distribution",
  "evidenceUrl",
]

const baseRef = process.env.GITHUB_BASE_REF
  ? `origin/${process.env.GITHUB_BASE_REF}`
  : "origin/main"
const headRef = "HEAD"
const errors = []
const changedFiles = changedFilesFromBase(baseRef, headRef)
const toolSourceChanges = []
const logoAssetChanges = []
const versionPlanChanges = []
const packageChurnChanges = []
const controlSurfaceChanges = []

for (const change of changedFiles) {
  for (const file of change.files) {
    if (isVersionPlanFile(file)) {
      versionPlanChanges.push(file)
    }

    if (isPackageChurnFile(file)) {
      packageChurnChanges.push(file)
    }

    if (isControlSurfaceFile(file)) {
      controlSurfaceChanges.push(file)
    }

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

    if (file.startsWith("packages/website/public/logos/tools/")) {
      logoAssetChanges.push(file)
      validateLogoAssetPath(file)
    }
  }
}

const uniqueToolSourceChanges = [...new Set(toolSourceChanges)]
const uniqueLogoAssetChanges = [...new Set(logoAssetChanges)]

if (uniqueToolSourceChanges.length > 1) {
  errors.push(
    `Catalog PRs must add or update exactly one tool source file. Found: ${uniqueToolSourceChanges.join(", ")}`
  )
}

if (uniqueLogoAssetChanges.length > 1) {
  errors.push(
    `Catalog PRs must include at most one tool logo SVG. Found: ${uniqueLogoAssetChanges.join(", ")}`
  )
}

validateToolLogoPairing(uniqueToolSourceChanges, uniqueLogoAssetChanges)

if (toolSourceChanges.length > 0 && packageChurnChanges.length > 0) {
  errors.push(
    `Catalog PRs must not include package, lockfile, changelog, or release-only churn. Remove: ${[...new Set(packageChurnChanges)].join(", ")}`
  )
}

if (toolSourceChanges.length > 0 && controlSurfaceChanges.length > 0) {
  errors.push(
    `Catalog PRs must not change repo control surfaces such as workflows, scripts, app code, or agent skills. Remove: ${[...new Set(controlSurfaceChanges)].join(", ")}`
  )
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
      toolSourceFiles: uniqueToolSourceChanges.length,
      toolLogoFiles: uniqueLogoAssetChanges.length,
      versionPlanFiles: [...new Set(versionPlanChanges)].length,
      packageChurnFiles: [...new Set(packageChurnChanges)].length,
      controlSurfaceFiles: [...new Set(controlSurfaceChanges)].length,
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

    validateLogoPathField(file, tool, slug)
    validateLaunchSignals(file, tool)
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function validateLogoPathField(file, tool, slug) {
  const expectedPath = `/logos/tools/${slug}.svg`

  if (tool.logoPath !== undefined && tool.logoPath !== null && tool.logoPath !== expectedPath) {
    errors.push(`${file}: logoPath must be "${expectedPath}" when present`)
  }
}

function validateLogoAssetPath(file) {
  if (!file.endsWith(".svg")) {
    errors.push(`${file}: tool logo files must be SVG`)
    return
  }

  const parts = file.split("/")

  if (parts.length !== 6) {
    errors.push(`${file}: expected packages/website/public/logos/tools/<slug>.svg`)
    return
  }

  const slug = parts[5].replace(/\.svg$/, "")

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`${file}: logo filename slug must be lowercase kebab-case`)
  }
}

function validateToolLogoPairing(toolFiles, logoFiles) {
  if (toolFiles.length !== 1) {
    return
  }

  const toolFile = toolFiles[0]
  const toolSlug = toolFile.split("/").at(-1).replace(/\.json$/, "")
  const expectedLogoFile = `packages/website/public/logos/tools/${toolSlug}.svg`

  for (const logoFile of logoFiles) {
    if (logoFile !== expectedLogoFile) {
      errors.push(`${logoFile}: logo filename must match the tool slug "${toolSlug}"`)
    }
  }

  if (logoFiles.includes(expectedLogoFile)) {
    try {
      const tool = JSON.parse(readFileSync(toolFile, "utf8"))
      const expectedLogoPath = `/logos/tools/${toolSlug}.svg`

      if (tool.logoPath !== expectedLogoPath) {
        errors.push(`${toolFile}: set logoPath to "${expectedLogoPath}" when adding ${expectedLogoFile}`)
      }
    } catch {
      // validateToolSourcePath reports parse errors for the tool source file.
    }
  }
}

function validateLaunchSignals(file, tool) {
  const signals = tool.launchSignals

  if (!signals || typeof signals !== "object" || Array.isArray(signals)) {
    errors.push(`${file}: launchSignals must be an object with honest public evidence`)
    return
  }

  for (const key of launchSignalKeys) {
    if (!(key in signals)) {
      errors.push(`${file}: launchSignals.${key} is required; use null for unavailable numeric signals and unknown only where the schema allows it`)
    }
  }

  if ("adoptionTier" in signals) {
    validateEnum(file, "launchSignals.adoptionTier", signals.adoptionTier, adoptionTiers)
  }
  if ("ecosystemImportance" in signals) {
    validateEnum(
      file,
      "launchSignals.ecosystemImportance",
      signals.ecosystemImportance,
      ecosystemImportanceValues
    )
  }
  if ("githubStars" in signals) {
    validateNumberOrNull(file, "launchSignals.githubStars", signals.githubStars)
  }
  if ("packageDownloadsMonthly" in signals) {
    validateNumberOrNull(
      file,
      "launchSignals.packageDownloadsMonthly",
      signals.packageDownloadsMonthly
    )
  }
  if ("maturity" in signals) {
    validateEnum(file, "launchSignals.maturity", signals.maturity, maturityValues)
  }
  if ("distribution" in signals) {
    validateEnum(file, "launchSignals.distribution", signals.distribution, distributionValues)
  }
  if ("evidenceUrl" in signals) {
    validateEvidenceUrl(file, signals.evidenceUrl)
  }
}

function validateEnum(file, field, value, allowed) {
  if (typeof value !== "string" || !allowed.has(value)) {
    errors.push(`${file}: ${field} must be one of ${[...allowed].join(", ")}`)
  }
}

function validateNumberOrNull(file, field, value) {
  if (value === null) return

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push(`${file}: ${field} must be a non-negative number or null`)
  }
}

function validateEvidenceUrl(file, value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${file}: launchSignals.evidenceUrl must be a public evidence URL, not a placeholder`)
    return
  }

  if (/^(tbd|todo|unknown|n\/a|not applicable)$/i.test(value.trim())) {
    errors.push(`${file}: launchSignals.evidenceUrl must not be a placeholder`)
    return
  }

  try {
    const url = new URL(value)
    if (!["http:", "https:"].includes(url.protocol)) {
      errors.push(`${file}: launchSignals.evidenceUrl must use http(s)`)
    }
  } catch {
    errors.push(`${file}: launchSignals.evidenceUrl must be a valid public URL`)
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

function isVersionPlanFile(file) {
  return file.startsWith(".changeset/") && file.endsWith(".md") && file !== ".changeset/README.md"
}

function isPackageChurnFile(file) {
  if (
    file === "package.json" ||
    file === "bun.lock" ||
    file === "package-lock.json" ||
    file === "pnpm-lock.yaml" ||
    file === "yarn.lock"
  ) {
    return true
  }

  return (
    file.endsWith("/package.json") ||
    file.endsWith("/CHANGELOG.md") ||
    file.startsWith(".github/workflows/release") ||
    file.startsWith("scripts/release-") ||
    file.startsWith("scripts/detect-version-") ||
    file.startsWith("scripts/sync-cli-version")
  )
}

function isControlSurfaceFile(file) {
  if (
    file.startsWith(".github/") ||
    file.startsWith("scripts/") ||
    file.startsWith("skills/") ||
    file.startsWith("packages/cli/") ||
    file.startsWith("packages/website/src/") ||
    file.startsWith("packages/website/scripts/")
  ) {
    return true
  }

  return [
    ".env",
    ".env.local",
    ".npmrc",
    "next.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
    "tsconfig.base.json",
    "vercel.json",
  ].includes(file)
}

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
  } catch {
    return ""
  }
}
