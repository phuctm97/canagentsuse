import { readdir, readFile, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const taxonomyPath = join(repoRoot, "data/taxonomy.json")
const toolsRoot = join(repoRoot, "data/tools")
const catalogPath = join(repoRoot, "data/catalog.json")
const catalogLabel = "data/catalog.json"
const checkOnly = process.argv.includes("--check")

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

let taxonomy

try {
  taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"))
} catch (error) {
  console.error("Could not parse data/taxonomy.json.")
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const toolFiles = await listJsonFiles(toolsRoot)
const seenSlugs = new Map()
const tools = []
const errors = []

for (const file of toolFiles) {
  let tool

  try {
    tool = JSON.parse(await readFile(file, "utf8"))
  } catch (error) {
    errors.push(`${relative(repoRoot, file)}: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }

  const slug = typeof tool.slug === "string" ? tool.slug : ""
  const expectedFilename = `${slug}.json`

  if (!slugPattern.test(slug)) {
    errors.push(`${relative(repoRoot, file)}: tool.slug must match ${slugPattern}`)
  }

  if (basename(file) !== expectedFilename) {
    errors.push(`${relative(repoRoot, file)}: filename must be ${expectedFilename}`)
  }

  const expectedFolder = sourceFolderForSlug(slug)
  const relativeFile = relative(toolsRoot, file)
  const actualFolder = relativeFile.split("/")[0]

  if (actualFolder !== expectedFolder) {
    errors.push(`${relative(repoRoot, file)}: expected folder data/tools/${expectedFolder}`)
  }

  const previous = seenSlugs.get(slug)
  if (previous) {
    errors.push(
      `${relative(repoRoot, file)}: duplicate tool slug "${slug}" also found in ${relative(repoRoot, previous)}`
    )
  }

  seenSlugs.set(slug, file)
  tools.push(tool)
}

if (errors.length > 0) {
  console.error("Catalog source errors:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

const catalog = {
  generatedAt: taxonomy.generatedAt,
  source: taxonomy.source,
  categories: taxonomy.categories,
  capabilities: taxonomy.capabilities,
  useCases: taxonomy.useCases,
  tools: tools.sort((left, right) => left.name.localeCompare(right.name)),
}
const formatted = `${JSON.stringify(catalog, null, 2)}\n`

let current = ""
try {
  current = await readFile(catalogPath, "utf8")
} catch {
  current = ""
}

if (current === formatted) {
  console.log(`${catalogLabel} is already generated from split catalog sources.`)
  process.exit(0)
}

if (checkOnly) {
  console.error(`${catalogLabel} is stale. Run: bun run catalog:build`)
  process.exit(1)
}

await writeFile(catalogPath, formatted)
console.log(`Generated ${catalogLabel} from ${toolFiles.length} tool source files.`)

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listJsonFiles(path))
    } else if (entry.isFile() && extname(entry.name) === ".json") {
      files.push(path)
    }
  }

  return files.sort()
}

function sourceFolderForSlug(slug) {
  const first = slug.charAt(0)

  return /^[a-z]$/.test(first) ? first : "0-9"
}
