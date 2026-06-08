import { spawn } from "node:child_process"
import {
  mkdtemp,
  readFile,
  rm,
  stat,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const cli = resolve(packageRoot, "dist/index.js")
const noAgentCliEnv = {
  ...process.env,
  PATH: "/usr/bin:/bin",
}

await run("bun", ["run", "build"], packageRoot)
await run(process.execPath, [cli, "--help"], packageRoot)
await run(process.execPath, [cli, "--version"], packageRoot)
await run(process.execPath, [cli, "mcp-config", "--json"], packageRoot)
await run(process.execPath, [cli, "docs"], packageRoot)
await run(process.execPath, [cli, "skills", "list"], packageRoot)
await run(process.execPath, [cli, "setup", "--all-agents", "--project", "--dry-run"], packageRoot)
await run(process.execPath, [cli, "install", "--all-agents", "--project", "--dry-run"], packageRoot)
await run(process.execPath, [cli, "remove", "--all-agents", "--project", "--dry-run"], packageRoot)
await testProjectInstall()

async function testProjectInstall() {
  const tempProject = await mkdtemp(join(tmpdir(), "canagentsuse-cli-"))

  try {
    await run(
      process.execPath,
      [cli, "setup", "--all-agents", "--project", "--yes"],
      tempProject,
      noAgentCliEnv
    )

    await assertJsonPath(join(tempProject, ".mcp.json"), ["mcpServers", "canagentsuse"])
    await assertJsonPath(join(tempProject, ".cursor/mcp.json"), ["mcpServers", "canagentsuse"])
    await assertTextIncludes(
      join(tempProject, ".codex/config.toml"),
      "[mcp_servers.canagentsuse]"
    )
    await assertJsonPath(join(tempProject, "opencode.json"), ["mcp", "canagentsuse"])
    await assertJsonPath(join(tempProject, ".gemini/settings.json"), [
      "mcpServers",
      "canagentsuse",
    ])

    for (const root of [
      ".claude/skills",
      ".cursor/skills",
      ".codex/skills",
      ".opencode/skills",
      ".gemini/skills",
      ".agents/skills",
    ]) {
      await assertDirectory(join(tempProject, root, "can-agents-use"))
      await assertDirectory(join(tempProject, root, "find-mcp-tools"))
    }

    await run(
      process.execPath,
      [cli, "status", "--project", "--json"],
      tempProject,
      noAgentCliEnv
    )
    await run(
      process.execPath,
      [cli, "remove", "--all", "--all-agents", "--project", "--yes"],
      tempProject,
      noAgentCliEnv
    )

    await assertJsonMissingPath(join(tempProject, ".mcp.json"), ["mcpServers", "canagentsuse"])
    await assertJsonMissingPath(join(tempProject, ".cursor/mcp.json"), [
      "mcpServers",
      "canagentsuse",
    ])
    await assertTextMissing(
      join(tempProject, ".codex/config.toml"),
      "[mcp_servers.canagentsuse]"
    )
    await assertJsonMissingPath(join(tempProject, "opencode.json"), ["mcp", "canagentsuse"])
    await assertJsonMissingPath(join(tempProject, ".gemini/settings.json"), [
      "mcpServers",
      "canagentsuse",
    ])
  } finally {
    await rm(tempProject, { force: true, recursive: true })
  }
}

async function run(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env
) {
  const child = spawn(command, args, {
    cwd,
    env,
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

async function assertJsonPath(path: string, keys: string[]) {
  const json = JSON.parse(await readFile(path, "utf8")) as unknown
  if (readPath(json, keys) === undefined) {
    throw new Error(`Expected ${path} to contain ${keys.join(".")}`)
  }
}

async function assertJsonMissingPath(path: string, keys: string[]) {
  const json = JSON.parse(await readFile(path, "utf8")) as unknown
  if (readPath(json, keys) !== undefined) {
    throw new Error(`Expected ${path} to omit ${keys.join(".")}`)
  }
}

async function assertTextIncludes(path: string, value: string) {
  const text = await readFile(path, "utf8")
  if (!text.includes(value)) throw new Error(`Expected ${path} to include ${value}`)
}

async function assertTextMissing(path: string, value: string) {
  const text = await readFile(path, "utf8")
  if (text.includes(value)) throw new Error(`Expected ${path} to omit ${value}`)
}

async function assertDirectory(path: string) {
  const info = await stat(path)
  if (!info.isDirectory()) throw new Error(`Expected ${path} to be a directory`)
}

function readPath(value: unknown, keys: string[]) {
  let current = value
  for (const key of keys) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}
