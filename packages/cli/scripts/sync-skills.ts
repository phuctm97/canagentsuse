import { cp, mkdir, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = resolve(packageRoot, "../..")
const source = resolve(repoRoot, "skills")
const destination = resolve(packageRoot, "skills")

await rm(destination, { force: true, recursive: true })
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true })
