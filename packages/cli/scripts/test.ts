import { spawn } from "node:child_process"
import { createServer, type Server } from "node:http"
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
const mockInstallGuide = {
  site: {
    name: "Can Agents Use",
    url: "http://127.0.0.1",
  },
  recommendation: "Use the CLI when shell access is available.",
  cli: {
    fullSetup: "npx canagentsuse@latest setup --all-agents --yes",
    dryRun: "npx canagentsuse@latest setup --all-agents --dry-run",
    mcpOnly: "npx canagentsuse@latest setup --mcp --all-agents --yes",
    skillsOnly: "npx canagentsuse@latest setup --cli --all-agents --yes",
    doctor: "npx canagentsuse@latest doctor",
  },
  mcp: {
    endpoint: "http://127.0.0.1/api/mcp",
    tools: ["search_agent_tools", "get_agent_install_guide"],
    resources: ["canagentsuse://catalog", "canagentsuse://install"],
  },
  skills: {
    primarySkill: "can-agents-use",
    skillMarkdown: "http://127.0.0.1/skill.md",
    skillsShInstall: "npx skills add phuctm97/canagentsuse --skill can-agents-use",
  },
  guardrails: ["Do not request database credentials."],
}
const mockScoreModel = [
  {
    key: "operability",
    label: "Machine operability",
    weight: 25,
    signals: [{ slug: "api", label: "API", weight: 10 }],
  },
]
const mockTools = [
  mockTool("stripe", "Stripe", 96),
  mockTool("revenuecat", "RevenueCat", 86),
  mockTool("github", "GitHub", 82),
]
const mockCatalog = {
  site: {
    name: "Can Agents Use",
    description: "Mock sorted catalog",
    scoreModel: mockScoreModel,
  },
  tools: mockTools,
  categories: [],
  capabilities: [],
  useCases: [],
}
const mockServer = await startMockServer()

try {
  await run("bun", ["run", "build"], packageRoot)
  const helpOutput = await run(process.execPath, [cli, "--help"], packageRoot)
  assertOutputIncludes(helpOutput, "canagentsuse install-guide [--json]", "--help")
  await run(process.execPath, [cli, "--version"], packageRoot)
  await run(process.execPath, [cli, "mcp-config", "--json"], packageRoot)
  const docsOutput = await run(process.execPath, [cli, "docs"], packageRoot)
  assertOutputIncludes(docsOutput, "/api/agent/install", "docs")
  const installGuideOutput = await run(
    process.execPath,
    [cli, "install-guide", "--site", mockServer.url, "--json"],
    packageRoot
  )
  assertJsonOutputPath(
    installGuideOutput,
    ["cli", "fullSetup"],
    "npx canagentsuse@latest setup --all-agents --yes",
    "install-guide --json"
  )
  const installGuideTextOutput = await run(
    process.execPath,
    [cli, "install-guide", "--site", mockServer.url],
    packageRoot
  )
  assertOutputIncludes(installGuideTextOutput, "Can Agents Use install guide", "install-guide")
  assertOutputIncludes(installGuideTextOutput, "get_agent_install_guide", "install-guide")
  const catalogOutput = await run(
    process.execPath,
    [cli, "catalog", "--site", mockServer.url, "--json"],
    packageRoot
  )
  assertJsonToolsSortedByScore(catalogOutput, ["tools"], "catalog --json")
  const searchOutput = await run(
    process.execPath,
    [cli, "search", "billing", "--site", mockServer.url, "--json"],
    packageRoot
  )
  assertJsonToolsSortedByScore(searchOutput, ["tools"], "search --json")
  const searchTextOutput = await run(
    process.execPath,
    [cli, "search", "billing", "--site", mockServer.url],
    packageRoot
  )
  assertOutputOrder(searchTextOutput, ["Stripe (stripe) - 96/100", "RevenueCat (revenuecat) - 86/100", "GitHub (github) - 82/100"], "search")
  const scoreModelOutput = await run(
    process.execPath,
    [cli, "score-model", "--site", mockServer.url, "--json"],
    packageRoot
  )
  assertJsonOutputPath(scoreModelOutput, [0, "key"], "operability", "score-model --json")
  await run(process.execPath, [cli, "skills", "list"], packageRoot)
  await run(process.execPath, [cli, "setup", "--all-agents", "--project", "--dry-run"], packageRoot)
  await run(process.execPath, [cli, "setup", "--cli", "--all-agents", "--project", "--dry-run"], packageRoot)
  await run(process.execPath, [cli, "setup", "--mcp", "--cursor", "--global", "--dry-run"], packageRoot)
  await run(process.execPath, [cli, "install", "--all-agents", "--project", "--dry-run"], packageRoot)
  await run(process.execPath, [cli, "remove", "--all-agents", "--project", "--dry-run"], packageRoot)
  await testProjectInstall()
} finally {
  await closeServer(mockServer.server)
}

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
): Promise<string> {
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

  return output
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

function readPath(value: unknown, keys: Array<string | number>) {
  let current = value
  for (const key of keys) {
    if (typeof key === "number") {
      if (!Array.isArray(current)) return undefined
      current = current[key]
      continue
    }

    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

async function startMockServer(): Promise<{ server: Server; url: string }> {
  const server = createServer((request, response) => {
    response.setHeader("content-type", "application/json")

    if (request.url?.startsWith("/api/agent/install")) {
      response.end(JSON.stringify(mockInstallGuide))
      return
    }

    if (request.url?.startsWith("/api/agent/catalog")) {
      response.end(JSON.stringify(mockCatalog))
      return
    }

    if (request.url?.startsWith("/api/agent/search")) {
      response.end(
        JSON.stringify({
          query: "billing",
          category: "",
          capability: "",
          page: 1,
          limit: 10,
          count: mockTools.length,
          total: mockTools.length,
          totalPages: 1,
          hasMore: false,
          tools: mockTools,
        })
      )
      return
    }

    response.statusCode = 404
    response.end(JSON.stringify({ error: "not found" }))
  })

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen)
      resolveListen()
    })
  })

  const address = server.address()
  if (!address || typeof address === "string") {
    throw new Error("Mock server did not expose a TCP port")
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
  }
}

async function closeServer(server: Server) {
  await new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) rejectClose(error)
      else resolveClose()
    })
  })
}

function assertOutputIncludes(output: string, value: string, label: string) {
  if (!output.includes(value)) {
    throw new Error(`Expected ${label} output to include ${value}`)
  }
}

function assertOutputOrder(output: string, values: string[], label: string) {
  let previousIndex = -1

  for (const value of values) {
    const index = output.indexOf(value)

    if (index === -1) {
      throw new Error(`Expected ${label} output to include ${value}`)
    }

    if (index <= previousIndex) {
      throw new Error(`Expected ${label} output to list ${values.join(", ")} in order`)
    }

    previousIndex = index
  }
}

function assertJsonToolsSortedByScore(output: string, keys: string[], label: string) {
  const json = JSON.parse(output) as unknown
  const tools = readPath(json, keys)

  if (!Array.isArray(tools)) {
    throw new Error(`Expected ${label} JSON ${keys.join(".")} to be an array`)
  }

  for (let index = 1; index < tools.length; index += 1) {
    const previousScore = readPath(tools[index - 1], ["agentScore"])
    const currentScore = readPath(tools[index], ["agentScore"])

    if (typeof previousScore !== "number" || typeof currentScore !== "number") {
      throw new Error(`Expected ${label} tool scores to be numbers`)
    }

    if (previousScore < currentScore) {
      throw new Error(`Expected ${label} tools to be sorted by descending agentScore`)
    }
  }
}

function assertJsonOutputPath(
  output: string,
  keys: Array<string | number>,
  expected: unknown,
  label: string
) {
  const json = JSON.parse(output) as unknown
  const value = readPath(json, keys)

  if (value !== expected) {
    throw new Error(`Expected ${label} JSON ${keys.join(".")} to equal ${String(expected)}`)
  }
}

function mockTool(slug: string, name: string, agentScore: number) {
  return {
    slug,
    name,
    url: `http://127.0.0.1/tools/${slug}`,
    websiteUrl: `https://${slug}.example.com`,
    tagline: `${name} tagline`,
    shortDescription: `${name} short description`,
    agentSummary: `${name} agent summary`,
    bestFor: `${name} best for`,
    cautionNotes: `${name} caution`,
    pricingSummary: `${name} pricing`,
    authModel: `${name} auth`,
    accountCreation: `${name} account setup`,
    browserSupport: `${name} browser support`,
    agentScore,
    agentTier: "Strong",
    categories: [],
    useCases: [],
    capabilities: [],
  }
}
