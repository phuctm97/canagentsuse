import { readFile, writeFile } from "node:fs/promises"

const catalogPath = "data/catalog.json"
const checkOnly = process.argv.includes("--check")

let catalog

try {
  catalog = JSON.parse(await readFile(catalogPath, "utf8"))
} catch (error) {
  console.error(`Could not parse ${catalogPath}.`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const formatted = `${JSON.stringify(catalog, null, 2)}\n`
const current = await readFile(catalogPath, "utf8")

if (current === formatted) {
  console.log(`${catalogPath} is already formatted.`)
  process.exit(0)
}

if (checkOnly) {
  console.error(`${catalogPath} is not formatted. Run: bun run catalog:format`)
  process.exit(1)
}

await writeFile(catalogPath, formatted)
console.log(`Formatted ${catalogPath}.`)
