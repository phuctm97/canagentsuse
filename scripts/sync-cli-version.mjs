import { readFile, writeFile } from "node:fs/promises"

const packagePath = "packages/cli/package.json"
const sourcePath = "packages/cli/src/index.ts"

const packageJson = JSON.parse(await readFile(packagePath, "utf8"))
const version = packageJson.version
const source = await readFile(sourcePath, "utf8")
const next = source.replace(/const VERSION = ".*?"/, `const VERSION = "${version}"`)

if (source !== next) {
  await writeFile(sourcePath, next)
}
