import { readdir, readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"

const changesetDir = ".changeset"
const cliPackage = "canagentsuse"
const websitePackage = "@canagentsuse/website"
const packages = new Set()
const files = []

if (existsSync(changesetDir)) {
  const entries = await readdir(changesetDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") {
      continue
    }

    const path = join(changesetDir, entry.name)
    const text = await readFile(path, "utf8")
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)

    if (!frontmatter) {
      continue
    }

    files.push(path)

    for (const line of frontmatter[1].split("\n")) {
      const match = line.match(/^["']?([^"':]+(?:\/[^"':]+)?)["']?:\s*(patch|minor|major|none)$/)
      if (match?.[1]) {
        packages.add(match[1])
      }
    }
  }
}

const packageList = [...packages].sort()
const plan = {
  hasPlan: packageList.length > 0,
  packages: packageList,
  changesets: files.sort(),
  cli: packageList.includes(cliPackage),
  website: packageList.includes(websitePackage),
}

console.log(JSON.stringify(plan, null, 2))

if (process.env.GITHUB_OUTPUT) {
  await appendOutput("has_plan", String(plan.hasPlan))
  await appendOutput("packages", JSON.stringify(plan.packages))
  await appendOutput("changesets", JSON.stringify(plan.changesets))
  await appendOutput("cli", String(plan.cli))
  await appendOutput("website", String(plan.website))
}

async function appendOutput(name, value) {
  const { appendFile } = await import("node:fs/promises")
  await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`)
}
