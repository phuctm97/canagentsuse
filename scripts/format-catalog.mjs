import { readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sourcePaths = [join(repoRoot, "data/taxonomy.json")]
const toolsRoot = join(repoRoot, "data/tools")
const checkOnly = process.argv.includes("--check")
const failures = []

sourcePaths.push(...await listJsonFiles(toolsRoot))

for (const sourcePath of sourcePaths) {
  let value

  try {
    value = JSON.parse(await readFile(sourcePath, "utf8"))
  } catch (error) {
    console.error(`Could not parse ${relative(repoRoot, sourcePath)}.`)
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  const formatted = `${JSON.stringify(value, null, 2)}\n`
  const current = await readFile(sourcePath, "utf8")

  if (current === formatted) {
    continue
  }

  if (checkOnly) {
    failures.push(relative(repoRoot, sourcePath))
  } else {
    await writeFile(sourcePath, formatted)
  }
}

if (failures.length > 0) {
  console.error("Catalog sources are not formatted. Run: bun run catalog:format")
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`${sourcePaths.length} catalog source files are formatted.`)

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
