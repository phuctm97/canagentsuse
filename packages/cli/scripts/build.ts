import { spawn } from "node:child_process"
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const entrypoint = resolve(packageRoot, "src/index.ts")
const outfile = resolve(packageRoot, "dist/index.js")
const shebang = "#!/usr/bin/env node"

await rm(resolve(packageRoot, "dist"), { force: true, recursive: true })
await mkdir(resolve(packageRoot, "dist"), { recursive: true })

await run("bun", ["build", entrypoint, "--target=node", "--format=esm", `--outfile=${outfile}`], packageRoot)

const compiled = await readFile(outfile, "utf8")

if (!compiled.startsWith(shebang)) {
  await writeFile(outfile, `${shebang}\n${compiled}`)
}

await chmod(outfile, 0o755)

async function run(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  })

  const code = await new Promise<number | null>((resolveCode) => {
    child.on("close", resolveCode)
  })

  if (code !== 0) {
    process.exit(code ?? 1)
  }
}
