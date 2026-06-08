import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const cli = resolve(packageRoot, "dist/index.js")

await run("bun", ["run", "build"], packageRoot)
await run("node", [cli, "--help"], packageRoot)
await run("node", [cli, "--version"], packageRoot)
await run("node", [cli, "mcp-config", "--json"], packageRoot)
await run("node", [cli, "docs"], packageRoot)
await run("node", [cli, "skills", "list"], packageRoot)
await run("node", [cli, "setup", "--all-agents", "--project", "--dry-run"], packageRoot)
await run("node", [cli, "remove", "--all-agents", "--project", "--dry-run"], packageRoot)

async function run(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: "pipe",
  })

  let output = ""
  let errorOutput = ""

  child.stdout.on("data", (chunk) => {
    output += chunk.toString()
  })
  child.stderr.on("data", (chunk) => {
    errorOutput += chunk.toString()
  })

  const code = await new Promise<number | null>((resolveCode) => {
    child.on("close", resolveCode)
  })

  if (code !== 0) {
    console.error(`Command failed: ${command} ${args.join(" ")}`)
    console.error(output)
    console.error(errorOutput)
    process.exit(code ?? 1)
  }
}
