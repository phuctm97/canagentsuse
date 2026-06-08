#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import { constants } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { homedir } from "node:os"
import { fileURLToPath } from "node:url"
import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

const VERSION = "0.2.4"
const DEFAULT_SITE_URL = "https://canagentsuse.com"
const MAX_LIMIT = 50
const MCP_NAME = "canagentsuse"
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const BUNDLED_SKILLS_DIR = join(PACKAGE_ROOT, "skills")

type ParsedArgs = {
  command: string
  positionals: string[]
  flags: Record<string, string | boolean>
}

type AgentTarget = "claude" | "cursor" | "codex" | "opencode" | "gemini" | "universal"
type InstallMode = "both" | "mcp" | "skill"
type InstallScope = "global" | "project"

type AgentCapability = {
  slug?: string
  name?: string
  supportLevel?: string
  detail?: string
}

type AgentTool = {
  slug: string
  name: string
  url?: string
  websiteUrl?: string
  docsUrl?: string | null
  githubUrl?: string | null
  tagline?: string
  shortDescription?: string
  agentSummary?: string
  bestFor?: string
  cautionNotes?: string | null
  pricingSummary?: string
  authModel?: string
  accountCreation?: string
  browserSupport?: string
  cliPackage?: string | null
  apiBaseUrl?: string | null
  mcpServer?: string | null
  agentScore?: number
  agentTier?: string
  categories?: { slug: string; name: string }[]
  useCases?: { slug: string; name: string }[]
  capabilities?: AgentCapability[]
}

type AgentSearchResponse = {
  query: string
  category: string
  capability: string
  page: number
  limit: number
  count: number
  total: number
  totalPages: number
  hasMore: boolean
  tools: AgentTool[]
}

type AgentCatalogResponse = {
  site?: {
    name?: string
    description?: string
    url?: string
    interfaceVersion?: string
    guidance?: string[]
    scoreModel?: unknown
    endpoints?: Record<string, string>
  }
  tools?: AgentTool[]
  categories?: { slug: string; name: string; description?: string }[]
  capabilities?: { slug: string; name: string; description?: string }[]
}

type AgentInstallGuideResponse = {
  site?: {
    name?: string
    url?: string
    purpose?: string
  }
  recommendation?: string
  cli?: {
    fullSetup?: string
    dryRun?: string
    mcpOnly?: string
    skillsOnly?: string
    doctor?: string
    installOneSkill?: string
    bestPractices?: string[]
  }
  mcp?: {
    endpoint?: string
    tools?: string[]
    resources?: string[]
  }
  skills?: {
    primarySkill?: string
    skillMarkdown?: string
    skillsShInstall?: string
  }
  api?: Record<string, unknown>
  markdown?: Record<string, unknown>
  guardrails?: string[]
}

type SetupOptions = {
  dryRun: boolean
  mode: InstallMode
  scope: InstallScope
  site: URL
  targets: AgentTarget[]
  yes: boolean
}

type InstallStatus = {
  target: AgentTarget
  mcp: "installed" | "missing" | "unsupported" | "unknown"
  skills: string[]
  skillDir: string
  mcpConfig?: string
}

const agentTargets: AgentTarget[] = [
  "claude",
  "cursor",
  "codex",
  "opencode",
  "gemini",
  "universal",
]

main().catch((error) => {
  printError(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

async function main() {
  const parsed = parseArgs(process.argv.slice(2))

  if (parsed.flags.help || parsed.command === "help") {
    printHelp()
    return
  }

  if (parsed.flags.version || parsed.command === "version") {
    console.log(VERSION)
    return
  }

  switch (parsed.command) {
    case "":
      printHelp()
      break
    case "search":
      await search(parsed)
      break
    case "tool":
      await tool(parsed)
      break
    case "catalog":
      await catalog(parsed)
      break
    case "mcp-config":
      mcpConfig(parsed)
      break
    case "install-guide":
      await installGuide(parsed)
      break
    case "score-model":
      await scoreModel(parsed)
      break
    case "docs":
      docs(parsed)
      break
    case "setup":
    case "install":
      await setup(parsed)
      break
    case "remove":
      await removeSetup(parsed)
      break
    case "status":
      await status(parsed)
      break
    case "doctor":
      await doctor(parsed)
      break
    case "skills":
      await skills(parsed)
      break
    default:
      throw new Error(`Unknown command "${parsed.command}". Run canagentsuse --help.`)
  }
}

async function search(parsed: ParsedArgs) {
  const query = parsed.positionals.join(" ").trim()
  const limit = normalizeLimit(parsed.flags.limit)
  const page = normalizePositiveInteger(parsed.flags.page, 1)
  const url = new URL("/api/agent/search", siteUrl(parsed))

  if (query) url.searchParams.set("q", query)
  if (typeof parsed.flags.category === "string") url.searchParams.set("category", parsed.flags.category)
  if (typeof parsed.flags.capability === "string") {
    url.searchParams.set("capability", parsed.flags.capability)
  }
  url.searchParams.set("page", String(page))
  url.searchParams.set("limit", String(limit))

  const data = await fetchJson<AgentSearchResponse>(url)

  if (parsed.flags.json) {
    printJson(data)
    return
  }

  const title = query ? `Search results for "${query}"` : "Top agent-friendly tools"
  console.log(`${title} (${data.total} total, page ${data.page}/${data.totalPages})`)
  console.log("")

  if (data.tools.length === 0) {
    console.log("No tools found. Try a broader query or remove filters.")
    return
  }

  for (const item of data.tools) {
    printToolSummary(item)
  }

  if (data.hasMore) {
    console.log(`Next page: canagentsuse search ${shellQuote(query)} --page ${data.page + 1} --limit ${data.limit}`.trim())
  }
}

async function tool(parsed: ParsedArgs) {
  const slug = parsed.positionals[0]

  if (!slug) {
    throw new Error("Missing tool slug. Example: canagentsuse tool stripe")
  }

  const data = await fetchJson<{ tool: AgentTool }>(
    new URL(`/api/agent/tools/${encodeURIComponent(slug)}`, siteUrl(parsed))
  )

  if (parsed.flags.json) {
    printJson(data.tool)
    return
  }

  printToolDetail(data.tool)
}

async function catalog(parsed: ParsedArgs) {
  const data = await fetchJson<AgentCatalogResponse>(
    new URL("/api/agent/catalog", siteUrl(parsed))
  )

  if (parsed.flags.json) {
    printJson(data)
    return
  }

  console.log(`${data.site?.name ?? "Can Agents Use"} catalog`)
  console.log(data.site?.description ?? "Find tools an AI agent can actually use.")
  console.log("")
  console.log(`Tools: ${data.tools?.length ?? 0}`)
  console.log(`Categories: ${data.categories?.length ?? 0}`)
  console.log(`Capabilities: ${data.capabilities?.length ?? 0}`)
  console.log("")
  console.log("For broad agent comparisons, fetch once with:")
  console.log("canagentsuse catalog --json")
}

function mcpConfig(parsed: ParsedArgs) {
  const config = cursorMcpConfig(siteUrl(parsed))

  if (parsed.flags.json) {
    printJson(config)
    return
  }

  console.log(JSON.stringify(config, null, 2))
}

async function installGuide(parsed: ParsedArgs) {
  const data = await fetchJson<AgentInstallGuideResponse>(
    new URL("/api/agent/install", siteUrl(parsed))
  )

  if (parsed.flags.json) {
    printJson(data)
    return
  }

  console.log(`${data.site?.name ?? "Can Agents Use"} install guide`)
  console.log(data.recommendation ?? "Use CLI, MCP, skills, API, or Markdown surfaces.")
  console.log("")
  console.log("CLI")
  printField("Full setup", data.cli?.fullSetup)
  printField("Dry run", data.cli?.dryRun)
  printField("MCP only", data.cli?.mcpOnly)
  printField("Skills only", data.cli?.skillsOnly)
  printField("Doctor", data.cli?.doctor)
  console.log("")
  console.log("MCP")
  printField("Endpoint", data.mcp?.endpoint)
  if (data.mcp?.tools?.length) console.log(`Tools: ${data.mcp.tools.join(", ")}`)
  if (data.mcp?.resources?.length) console.log(`Resources: ${data.mcp.resources.join(", ")}`)
  console.log("")
  console.log("Skills")
  printField("Primary skill", data.skills?.primarySkill)
  printField("Skill.md", data.skills?.skillMarkdown)
  printField("skills.sh", data.skills?.skillsShInstall)
  console.log("")
  console.log("For scripts and agents:")
  console.log("canagentsuse install-guide --json")
}

async function scoreModel(parsed: ParsedArgs) {
  const data = await fetchJson<AgentCatalogResponse>(
    new URL("/api/agent/catalog", siteUrl(parsed))
  )
  const score = data.site?.scoreModel ?? null

  if (parsed.flags.json) {
    printJson(score)
    return
  }

  console.log("Agent-friendliness score model")
  console.log("")
  console.log(JSON.stringify(score, null, 2))
}

function docs(parsed: ParsedArgs) {
  const site = siteUrl(parsed)
  const links = [
    ["Website", site.toString()],
    ["Agent guide", new URL("/agents", site).toString()],
    ["Skill.md", new URL("/skill.md", site).toString()],
    ["llms.txt", new URL("/llms.txt", site).toString()],
    ["llms-full.txt", new URL("/llms-full.txt", site).toString()],
    ["Install API", new URL("/api/agent/install", site).toString()],
    ["Catalog API", new URL("/api/agent/catalog", site).toString()],
    ["Search API", new URL("/api/agent/search?q=stripe&page=1&limit=10", site).toString()],
    ["MCP endpoint", new URL("/api/mcp", site).toString()],
    ["OpenAPI", new URL("/openapi.json", site).toString()],
  ]

  if (parsed.flags.json) {
    printJson(Object.fromEntries(links))
    return
  }

  for (const [label, url] of links) {
    console.log(`${label}: ${url}`)
  }
}

async function setup(parsed: ParsedArgs) {
  const options = await setupOptions(parsed)
  const skills = await bundledSkillNames()

  printSetupPlan("Setup", options, skills)
  await requireConfirmation(options)

  for (const target of options.targets) {
    if (options.mode !== "skill" && target !== "universal") {
      await installMcp(target, options)
    }

    if (options.mode !== "mcp") {
      await installSkills(target, options.scope, skills, options.dryRun)
    }
  }

  if (options.dryRun) {
    console.log("Dry run complete. Nothing was written.")
  } else {
    console.log("Can Agents Use setup complete.")
  }
}

async function removeSetup(parsed: ParsedArgs) {
  const options = await setupOptions(parsed)
  const skills = parsed.flags.all ? await bundledSkillNames() : ["can-agents-use"]

  printSetupPlan("Remove", options, skills)
  await requireConfirmation(options)

  for (const target of options.targets) {
    if (options.mode !== "skill" && target !== "universal") {
      await removeMcp(target, options)
    }

    if (options.mode !== "mcp") {
      await removeSkills(target, options.scope, skills, options.dryRun)
    }
  }

  if (options.dryRun) {
    console.log("Dry run complete. Nothing was removed.")
  } else {
    console.log("Can Agents Use setup removed.")
  }
}

async function status(parsed: ParsedArgs) {
  const targets = selectedTargets(parsed)
  const scope = selectedScope(parsed)
  const result = await Promise.all(targets.map((target) => installStatus(target, scope)))

  if (parsed.flags.json) {
    printJson({ scope, targets: result })
    return
  }

  console.log(`Can Agents Use status (${scope})`)
  console.log("")
  for (const item of result) {
    console.log(`${item.target}`)
    console.log(`  MCP: ${item.mcp}${item.mcpConfig ? ` (${item.mcpConfig})` : ""}`)
    console.log(`  Skills: ${item.skills.length > 0 ? item.skills.join(", ") : "missing"}`)
    console.log(`  Skill dir: ${item.skillDir}`)
  }
}

async function doctor(parsed: ParsedArgs) {
  const site = siteUrl(parsed)
  const checks: { name: string; ok: boolean; detail: string }[] = []

  try {
    const searchUrl = new URL("/api/agent/search?q=stripe&limit=1", site)
    const data = await fetchJson<AgentSearchResponse>(searchUrl)
    checks.push({
      name: "Search API",
      ok: data.tools.length > 0,
      detail: searchUrl.toString(),
    })
  } catch (error) {
    checks.push({ name: "Search API", ok: false, detail: errorMessage(error) })
  }

  try {
    const mcpUrl = new URL("/api/mcp", site)
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": `canagentsuse-cli/${VERSION}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    })
    checks.push({
      name: "MCP endpoint",
      ok: response.ok,
      detail: `${response.status} ${response.statusText} ${mcpUrl.toString()}`,
    })
  } catch (error) {
    checks.push({ name: "MCP endpoint", ok: false, detail: errorMessage(error) })
  }

  const scope = selectedScope(parsed)
  const targets = selectedTargets(parsed)
  for (const item of await Promise.all(targets.map((target) => installStatus(target, scope)))) {
    checks.push({
      name: `${item.target} skill`,
      ok: item.skills.includes("can-agents-use"),
      detail: item.skillDir,
    })
    if (item.target !== "universal") {
      checks.push({
        name: `${item.target} MCP`,
        ok: item.mcp === "installed",
        detail: item.mcpConfig ?? "no config",
      })
    }
  }

  if (parsed.flags.json) {
    printJson({ ok: checks.every((check) => check.ok), checks })
  } else {
    for (const check of checks) {
      console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.detail}`)
    }
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1
  }
}

async function skills(parsed: ParsedArgs) {
  const subcommand = parsed.positionals[0] ?? "list"

  if (subcommand === "list") {
    const skills = await bundledSkills()
    if (parsed.flags.json) {
      printJson(skills)
      return
    }
    for (const skill of skills) {
      console.log(`${skill.name}: ${skill.description}`)
    }
    return
  }

  if (subcommand === "install") {
    const options = await setupOptions({ ...parsed, flags: { ...parsed.flags, skill: true } })
    const names = await skillNamesFromArgs(parsed.positionals.slice(1), parsed.flags)
    printSetupPlan("Install skills", { ...options, mode: "skill" }, names)
    await requireConfirmation(options)
    for (const target of options.targets) {
      await installSkills(target, options.scope, names, options.dryRun)
    }
    return
  }

  if (subcommand === "remove") {
    const options = await setupOptions({ ...parsed, flags: { ...parsed.flags, skill: true } })
    const names = await skillNamesFromArgs(parsed.positionals.slice(1), parsed.flags)
    printSetupPlan("Remove skills", { ...options, mode: "skill" }, names)
    await requireConfirmation(options)
    for (const target of options.targets) {
      await removeSkills(target, options.scope, names, options.dryRun)
    }
    return
  }

  throw new Error(`Unknown skills command "${subcommand}". Use skills list, skills install, or skills remove.`)
}

async function setupOptions(parsed: ParsedArgs): Promise<SetupOptions> {
  const options = {
    dryRun: Boolean(parsed.flags.dryRun),
    mode: selectedMode(parsed),
    scope: selectedScope(parsed),
    site: siteUrl(parsed),
    targets: selectedTargets(parsed),
    yes: Boolean(parsed.flags.yes || parsed.flags.dryRun),
  }

  if (shouldPromptSetup(parsed)) {
    return promptSetupOptions(options)
  }

  return options
}

function selectedMode(parsed: ParsedArgs): InstallMode {
  const skillMode = Boolean(parsed.flags.skill || parsed.flags.cli)
  if (parsed.flags.mcp && !skillMode && !parsed.flags.all) return "mcp"
  if (skillMode && !parsed.flags.mcp && !parsed.flags.all) return "skill"
  return "both"
}

function selectedScope(parsed: ParsedArgs): InstallScope {
  if (parsed.flags.project && parsed.flags.global) {
    throw new Error("Choose either --project or --global, not both.")
  }
  return parsed.flags.project ? "project" : "global"
}

function selectedTargets(parsed: ParsedArgs): AgentTarget[] {
  if (parsed.flags.allAgents) return agentTargets

  const explicit = agentTargets.filter((target) => Boolean(parsed.flags[target]))
  if (explicit.length > 0) return explicit

  const detected = autoDetectTargets()
  return detected.length > 0 ? detected : ["universal"]
}

function autoDetectTargets(): AgentTarget[] {
  const detected: AgentTarget[] = []
  if (commandExists("claude") || pathLikelyExists(join(homedir(), ".claude"))) detected.push("claude")
  if (pathLikelyExists(join(homedir(), ".cursor")) || pathLikelyExists(join(process.cwd(), ".cursor"))) detected.push("cursor")
  if (commandExists("codex") || pathLikelyExists(join(homedir(), ".codex"))) detected.push("codex")
  if (commandExists("opencode") || pathLikelyExists(join(homedir(), ".config/opencode")) || pathLikelyExists(join(process.cwd(), "opencode.json"))) detected.push("opencode")
  if (commandExists("gemini") || pathLikelyExists(join(homedir(), ".gemini"))) detected.push("gemini")
  if (pathLikelyExists(join(homedir(), ".agents")) || pathLikelyExists(join(process.cwd(), ".agents"))) detected.push("universal")
  return detected
}

function shouldPromptSetup(parsed: ParsedArgs) {
  if (!(parsed.command === "setup" || parsed.command === "install")) return false
  if (!process.stdin.isTTY || parsed.flags.yes || parsed.flags.dryRun || parsed.flags.json) return false
  return !hasModeFlag(parsed) && !hasTargetFlag(parsed) && !hasScopeFlag(parsed)
}

function hasModeFlag(parsed: ParsedArgs) {
  return Boolean(parsed.flags.mcp || parsed.flags.skill || parsed.flags.cli || parsed.flags.all)
}

function hasTargetFlag(parsed: ParsedArgs) {
  return Boolean(parsed.flags.allAgents || agentTargets.some((target) => parsed.flags[target]))
}

function hasScopeFlag(parsed: ParsedArgs) {
  return Boolean(parsed.flags.project || parsed.flags.global)
}

async function promptSetupOptions(options: SetupOptions): Promise<SetupOptions> {
  const detected = autoDetectTargets()
  const rl = createInterface({ input, output })

  try {
    console.log("Can Agents Use setup")
    console.log("Pick what to install. Press Enter to use the recommended option.")
    console.log("")

    const mode = await promptSelect(rl, "Install mode", [
      { label: "MCP + Skills (recommended)", value: "both" as const },
      { label: "MCP only", value: "mcp" as const },
      { label: "CLI skills only", value: "skill" as const },
    ])

    const targetChoices: Array<{ label: string; value: AgentTarget[] }> = []
    if (detected.length > 0) {
      targetChoices.push({
        label: `Detected agents (${detected.join(", ")})`,
        value: detected,
      })
    }
    targetChoices.push(
      { label: "All supported agents", value: agentTargets },
      { label: "Claude Code", value: ["claude"] },
      { label: "Cursor", value: ["cursor"] },
      { label: "Codex", value: ["codex"] },
      { label: "OpenCode", value: ["opencode"] },
      { label: "Gemini CLI", value: ["gemini"] },
      { label: "Universal .agents skills folder", value: ["universal"] }
    )

    const targets = await promptSelect(rl, "Agent target", targetChoices)
    const scope = await promptSelect(rl, "Install location", [
      { label: "Global user config (recommended)", value: "global" as const },
      { label: "Current project only", value: "project" as const },
    ])

    return {
      ...options,
      mode,
      scope,
      targets,
    }
  } finally {
    rl.close()
  }
}

async function promptSelect<T>(
  rl: ReturnType<typeof createInterface>,
  question: string,
  choices: Array<{ label: string; value: T }>
) {
  for (;;) {
    console.log(question)
    choices.forEach((choice, index) => {
      const suffix = index === 0 ? " (default)" : ""
      console.log(`  ${index + 1}. ${choice.label}${suffix}`)
    })
    const answer = await rl.question("> ")
    const trimmed = answer.trim()
    if (!trimmed) {
      console.log("")
      return choices[0].value
    }
    const index = Number.parseInt(trimmed, 10) - 1
    if (Number.isInteger(index) && choices[index]) {
      console.log("")
      return choices[index].value
    }
    console.log(`Choose 1-${choices.length}.`)
  }
}

async function installMcp(target: AgentTarget, options: SetupOptions) {
  const url = new URL("/api/mcp", options.site).toString()

  switch (target) {
    case "claude":
      if (commandExists("claude")) {
        await runCommand(
          "claude",
          ["mcp", "add", "--transport", "http", MCP_NAME, "--scope", options.scope === "project" ? "project" : "user", url],
          options.dryRun
        )
      } else if (options.scope === "project") {
        await upsertMcpServersJson(join(process.cwd(), ".mcp.json"), cursorMcpConfig(options.site), options.dryRun)
      } else {
        printSkip("Claude MCP", "install Claude Code CLI or run with --project to write .mcp.json")
      }
      break
    case "cursor":
      await upsertMcpServersJson(cursorMcpPath(options.scope), cursorMcpConfig(options.site), options.dryRun)
      break
    case "codex":
      if (commandExists("codex") && options.scope === "global") {
        await runCommand("codex", ["mcp", "add", MCP_NAME, "--url", url], options.dryRun)
      } else {
        await upsertCodexToml(codexConfigPath(options.scope), url, options.dryRun)
      }
      break
    case "opencode":
      await upsertOpenCodeJson(openCodeConfigPath(options.scope), url, options.dryRun)
      break
    case "gemini":
      await upsertGeminiJson(geminiConfigPath(options.scope), url, options.dryRun)
      break
    case "universal":
      break
  }
}

async function removeMcp(target: AgentTarget, options: SetupOptions) {
  switch (target) {
    case "claude":
      if (commandExists("claude")) {
        await runCommand("claude", ["mcp", "remove", MCP_NAME, "--scope", options.scope === "project" ? "project" : "user"], options.dryRun)
      } else if (options.scope === "project") {
        await removeMcpServersJson(join(process.cwd(), ".mcp.json"), options.dryRun)
      } else {
        printSkip("Claude MCP", "install Claude Code CLI or run with --project")
      }
      break
    case "cursor":
      await removeMcpServersJson(cursorMcpPath(options.scope), options.dryRun)
      break
    case "codex":
      if (commandExists("codex") && options.scope === "global") {
        await runCommand("codex", ["mcp", "remove", MCP_NAME], options.dryRun)
      } else {
        await removeCodexToml(codexConfigPath(options.scope), options.dryRun)
      }
      break
    case "opencode":
      await removeOpenCodeJson(openCodeConfigPath(options.scope), options.dryRun)
      break
    case "gemini":
      await removeGeminiJson(geminiConfigPath(options.scope), options.dryRun)
      break
    case "universal":
      break
  }
}

async function installSkills(target: AgentTarget, scope: InstallScope, names: string[], dryRun: boolean) {
  const available = new Set(await bundledSkillNames())
  const destinationRoot = skillDir(target, scope)

  for (const name of names) {
    if (!available.has(name)) throw new Error(`Unknown bundled skill "${name}". Run canagentsuse skills list.`)
    const source = join(BUNDLED_SKILLS_DIR, name)
    const destination = join(destinationRoot, name)
    if (dryRun) {
      console.log(`[dry-run] copy ${source} -> ${destination}`)
      continue
    }
    await mkdir(destinationRoot, { recursive: true })
    await rm(destination, { recursive: true, force: true })
    await cp(source, destination, { recursive: true })
    console.log(`Installed skill ${name} -> ${destination}`)
  }
}

async function removeSkills(target: AgentTarget, scope: InstallScope, names: string[], dryRun: boolean) {
  const destinationRoot = skillDir(target, scope)

  for (const name of names) {
    const destination = join(destinationRoot, name)
    if (dryRun) {
      console.log(`[dry-run] remove ${destination}`)
      continue
    }
    await rm(destination, { recursive: true, force: true })
    console.log(`Removed skill ${name} from ${destination}`)
  }
}

async function installStatus(target: AgentTarget, scope: InstallScope): Promise<InstallStatus> {
  const dir = skillDir(target, scope)
  const skills = await installedSkills(dir)
  const mcp = await mcpStatus(target, scope)

  return {
    target,
    mcp: mcp.status,
    mcpConfig: mcp.path,
    skills,
    skillDir: dir,
  }
}

async function mcpStatus(target: AgentTarget, scope: InstallScope): Promise<{ status: InstallStatus["mcp"]; path?: string }> {
  if (target === "universal") return { status: "unsupported" }

  if (target === "cursor") {
    return jsonHasPath(cursorMcpPath(scope), ["mcpServers", MCP_NAME])
  }
  if (target === "opencode") {
    return jsonHasPath(openCodeConfigPath(scope), ["mcp", MCP_NAME])
  }
  if (target === "gemini") {
    return jsonHasPath(geminiConfigPath(scope), ["mcpServers", MCP_NAME])
  }
  if (target === "codex") {
    const path = codexConfigPath(scope)
    const text = await readTextOrEmpty(path)
    return { status: text.includes("[mcp_servers.canagentsuse]") ? "installed" : "missing", path }
  }
  if (target === "claude" && scope === "project") {
    return jsonHasPath(join(process.cwd(), ".mcp.json"), ["mcpServers", MCP_NAME])
  }
  return { status: "unknown", path: "managed by agent CLI/user config" }
}

async function jsonHasPath(path: string, keys: string[]): Promise<{ status: InstallStatus["mcp"]; path: string }> {
  try {
    const json = await readJson(path, {})
    let cursor: unknown = json
    for (const key of keys) {
      if (!cursor || typeof cursor !== "object" || !(key in cursor)) {
        return { status: "missing", path }
      }
      cursor = (cursor as Record<string, unknown>)[key]
    }
    return { status: "installed", path }
  } catch {
    return { status: "missing", path }
  }
}

async function upsertMcpServersJson(path: string, config: Record<string, unknown>, dryRun: boolean) {
  await updateJson(path, dryRun, (json) => {
    const current = isRecord(json) ? json : {}
    const incoming = config as { mcpServers: Record<string, unknown> }
    const servers = isRecord(current.mcpServers) ? current.mcpServers : {}
    current.mcpServers = { ...servers, [MCP_NAME]: incoming.mcpServers[MCP_NAME] }
    return current
  })
}

async function removeMcpServersJson(path: string, dryRun: boolean) {
  await updateJson(path, dryRun, (json) => {
    const current = isRecord(json) ? json : {}
    if (isRecord(current.mcpServers)) {
      delete current.mcpServers[MCP_NAME]
    }
    return current
  })
}

async function upsertOpenCodeJson(path: string, url: string, dryRun: boolean) {
  await updateJson(path, dryRun, (json) => {
    const current = isRecord(json) ? json : {}
    const mcp = isRecord(current.mcp) ? current.mcp : {}
    current.$schema ??= "https://opencode.ai/config.json"
    current.mcp = {
      ...mcp,
      [MCP_NAME]: {
        type: "remote",
        url,
        enabled: true,
      },
    }
    return current
  })
}

async function removeOpenCodeJson(path: string, dryRun: boolean) {
  await updateJson(path, dryRun, (json) => {
    const current = isRecord(json) ? json : {}
    if (isRecord(current.mcp)) delete current.mcp[MCP_NAME]
    return current
  })
}

async function upsertGeminiJson(path: string, url: string, dryRun: boolean) {
  await updateJson(path, dryRun, (json) => {
    const current = isRecord(json) ? json : {}
    const servers = isRecord(current.mcpServers) ? current.mcpServers : {}
    current.mcpServers = {
      ...servers,
      [MCP_NAME]: {
        httpUrl: url,
        trust: true,
      },
    }
    return current
  })
}

async function removeGeminiJson(path: string, dryRun: boolean) {
  await updateJson(path, dryRun, (json) => {
    const current = isRecord(json) ? json : {}
    if (isRecord(current.mcpServers)) delete current.mcpServers[MCP_NAME]
    return current
  })
}

async function upsertCodexToml(path: string, url: string, dryRun: boolean) {
  const block = `# Added by canagentsuse CLI\n[mcp_servers.canagentsuse]\nurl = ${JSON.stringify(url)}\n`
  const current = await readTextOrEmpty(path)
  const next = replaceCodexBlock(current, block)
  await writeText(path, next.trimEnd() + "\n", dryRun)
}

async function removeCodexToml(path: string, dryRun: boolean) {
  const current = await readTextOrEmpty(path)
  const next = replaceCodexBlock(current, "")
  await writeText(path, next.trimEnd() + "\n", dryRun)
}

function replaceCodexBlock(text: string, replacement: string) {
  const marked = /\n?# Added by canagentsuse CLI\n\[mcp_servers\.canagentsuse\]\n[\s\S]*?(?=\n\[|$)/
  const unmarked = /\n?\[mcp_servers\.canagentsuse\]\n[\s\S]*?(?=\n\[|$)/
  if (marked.test(text)) return text.replace(marked, replacement ? `\n${replacement}` : "")
  if (unmarked.test(text)) return text.replace(unmarked, replacement ? `\n${replacement}` : "")
  return `${text.trimEnd()}\n\n${replacement}`
}

async function updateJson(path: string, dryRun: boolean, updater: (json: unknown) => unknown) {
  const current = await readJson(path, {})
  const next = updater(current)
  await writeText(path, `${JSON.stringify(next, null, 2)}\n`, dryRun)
}

async function writeText(path: string, content: string, dryRun: boolean) {
  if (dryRun) {
    console.log(`[dry-run] write ${path}`)
    return
  }
  await mkdir(dirname(path), { recursive: true })
  if (await fileExists(path)) {
    await writeFile(`${path}.bak-${Date.now()}`, await readFile(path))
  }
  await writeFile(path, content)
  console.log(`Wrote ${path}`)
}

async function readJson(path: string, fallback: unknown) {
  if (!(await fileExists(path))) return fallback
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown
  } catch (error) {
    throw new Error(`Cannot parse ${path} as JSON. Fix the file or run with --dry-run first. ${errorMessage(error)}`)
  }
}

async function readTextOrEmpty(path: string) {
  if (!(await fileExists(path))) return ""
  return readFile(path, "utf8")
}

function cursorMcpConfig(site: URL) {
  return {
    mcpServers: {
      [MCP_NAME]: {
        type: "http",
        url: new URL("/api/mcp", site).toString(),
      },
    },
  }
}

function cursorMcpPath(scope: InstallScope) {
  return scope === "project"
    ? join(process.cwd(), ".cursor/mcp.json")
    : join(homedir(), ".cursor/mcp.json")
}

function codexConfigPath(scope: InstallScope) {
  return scope === "project"
    ? join(process.cwd(), ".codex/config.toml")
    : join(homedir(), ".codex/config.toml")
}

function openCodeConfigPath(scope: InstallScope) {
  return scope === "project"
    ? join(process.cwd(), "opencode.json")
    : join(homedir(), ".config/opencode/opencode.json")
}

function geminiConfigPath(scope: InstallScope) {
  return scope === "project"
    ? join(process.cwd(), ".gemini/settings.json")
    : join(homedir(), ".gemini/settings.json")
}

function skillDir(target: AgentTarget, scope: InstallScope) {
  const base = scope === "project" ? process.cwd() : homedir()
  const dirs: Record<AgentTarget, string> = {
    claude: scope === "project" ? ".claude/skills" : ".claude/skills",
    cursor: scope === "project" ? ".cursor/skills" : ".cursor/skills",
    codex: scope === "project" ? ".codex/skills" : ".codex/skills",
    opencode: scope === "project" ? ".opencode/skills" : ".config/opencode/skills",
    gemini: scope === "project" ? ".gemini/skills" : ".gemini/skills",
    universal: scope === "project" ? ".agents/skills" : ".agents/skills",
  }
  return join(base, dirs[target])
}

async function bundledSkills() {
  const names = await bundledSkillNames()
  return Promise.all(
    names.map(async (name) => {
      const text = await readFile(join(BUNDLED_SKILLS_DIR, name, "SKILL.md"), "utf8")
      return {
        name,
        description: frontmatterValue(text, "description") ?? "Can Agents Use skill",
      }
    })
  )
}

async function bundledSkillNames() {
  const entries = await readdir(BUNDLED_SKILLS_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

async function skillNamesFromArgs(args: string[], flags: Record<string, string | boolean>) {
  if (flags.all) return Array.from(new Set(args.length > 0 ? args : await bundledSkillNames()))
  if (args.length > 0) return args
  return ["can-agents-use"]
}

async function installedSkills(dir: string) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}

function frontmatterValue(text: string, key: string) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))
  return match?.[1]?.trim()
}

function printSetupPlan(label: string, options: SetupOptions, skills: string[]) {
  console.log(`${label} plan`)
  console.log(`  Site: ${options.site.toString()}`)
  console.log(`  Scope: ${options.scope}`)
  console.log(`  Mode: ${options.mode}`)
  console.log(`  Targets: ${options.targets.join(", ")}`)
  if (options.mode !== "mcp") console.log(`  Skills: ${skills.join(", ")}`)
  if (options.dryRun) console.log("  Dry run: yes")
  console.log("")
}

async function requireConfirmation(options: SetupOptions) {
  if (options.yes) return
  if (!process.stdin.isTTY) {
    throw new Error("Refusing to write in a non-interactive shell without --yes. Use --dry-run to preview.")
  }

  const rl = createInterface({ input, output })
  const answer = await rl.question("Continue? [y/N] ")
  rl.close()
  if (!/^y(es)?$/i.test(answer.trim())) {
    throw new Error("Cancelled.")
  }
}

async function runCommand(command: string, args: string[], dryRun: boolean) {
  if (dryRun) {
    console.log(`[dry-run] ${command} ${args.map(shellQuote).join(" ")}`)
    return
  }

  const child = spawn(command, args, { stdio: "inherit" })
  const code = await new Promise<number | null>((resolveCode) => child.on("close", resolveCode))
  if (code !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${code}`)
  }
}

function commandExists(command: string) {
  const checker = process.platform === "win32" ? "where" : "which"
  const result = spawnSync(checker, [command], { stdio: "ignore" })
  return result.status === 0
}

function pathLikelyExists(path: string) {
  try {
    spawnSync("test", ["-e", path], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

async function fileExists(path: string) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function printSkip(label: string, reason: string) {
  console.log(`Skipped ${label}: ${reason}`)
}

function printToolSummary(tool: AgentTool) {
  const score = typeof tool.agentScore === "number" ? `${tool.agentScore}/100` : "unscored"
  const signals = summarizeSignals(tool)
  const caution = tool.cautionNotes ? `\n  Caution: ${tool.cautionNotes}` : ""

  console.log(`${tool.name} (${tool.slug}) - ${score}`)
  console.log(`  ${tool.tagline ?? tool.shortDescription ?? tool.agentSummary ?? ""}`)
  if (signals) console.log(`  Signals: ${signals}`)
  if (tool.pricingSummary) console.log(`  Pricing: ${tool.pricingSummary}`)
  console.log(`  URL: ${tool.url ?? tool.websiteUrl ?? ""}${caution}`)
  console.log("")
}

function printToolDetail(tool: AgentTool) {
  console.log(`${tool.name} (${tool.slug})`)
  console.log(`Score: ${typeof tool.agentScore === "number" ? `${tool.agentScore}/100` : "unscored"}${tool.agentTier ? `, ${tool.agentTier}` : ""}`)
  console.log("")
  printField("Summary", tool.agentSummary ?? tool.shortDescription ?? tool.tagline)
  printField("Best for", tool.bestFor)
  printField("Pricing", tool.pricingSummary)
  printField("Auth", tool.authModel)
  printField("Account setup", tool.accountCreation)
  printField("Browser support", tool.browserSupport)
  printField("CLI", tool.cliPackage)
  printField("API", tool.apiBaseUrl)
  printField("MCP", tool.mcpServer)
  printField("Docs", tool.docsUrl)
  printField("GitHub", tool.githubUrl)
  printField("Website", tool.websiteUrl)
  printField("Can Agents Use URL", tool.url)
  printField("Caution", tool.cautionNotes)

  const capabilities = summarizeSignals(tool)
  if (capabilities) printField("Signals", capabilities)
}

function printField(label: string, value: string | null | undefined) {
  if (value) console.log(`${label}: ${value}`)
}

function summarizeSignals(tool: AgentTool) {
  const capabilities = tool.capabilities ?? []
  return capabilities
    .filter((capability) => capability.slug && capability.supportLevel && capability.supportLevel !== "none")
    .map((capability) => `${capability.slug}:${capability.supportLevel}`)
    .slice(0, 8)
    .join(", ")
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": `canagentsuse-cli/${VERSION}`,
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url.toString()}${body ? `\n${body}` : ""}`)
  }

  return response.json() as Promise<T>
}

function parseArgs(args: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {}
  const positionals: string[] = []
  let command = ""

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--") {
      positionals.push(...args.slice(index + 1))
      break
    }

    if (arg.startsWith("--")) {
      const [rawName, rawValue] = arg.slice(2).split("=", 2)
      const name = toCamelCase(rawName)

      if (rawValue !== undefined) {
        flags[name] = rawValue
      } else if (isBooleanFlag(name)) {
        flags[name] = true
      } else {
        const next = args[index + 1]
        if (!next || next.startsWith("-")) {
          flags[name] = true
        } else {
          flags[name] = next
          index += 1
        }
      }
      continue
    }

    if (arg.startsWith("-") && arg.length > 1) {
      for (const char of arg.slice(1)) {
        if (char === "j") flags.json = true
        if (char === "h") flags.help = true
        if (char === "v") flags.version = true
      }
      continue
    }

    if (!command) {
      command = arg
    } else {
      positionals.push(arg)
    }
  }

  return { command, flags, positionals }
}

function isBooleanFlag(name: string) {
  return [
    "all",
    "allAgents",
    "claude",
    "cli",
    "codex",
    "cursor",
    "dryRun",
    "gemini",
    "global",
    "help",
    "json",
    "mcp",
    "opencode",
    "project",
    "skill",
    "universal",
    "version",
    "yes",
  ].includes(name)
}

function siteUrl(parsed: ParsedArgs) {
  const value =
    (typeof parsed.flags.site === "string" && parsed.flags.site) ||
    process.env.CANAGENTSUSE_SITE_URL ||
    DEFAULT_SITE_URL

  try {
    return new URL(value)
  } catch {
    throw new Error(`Invalid site URL: ${value}`)
  }
}

function normalizeLimit(value: string | boolean | undefined) {
  return Math.min(normalizePositiveInteger(value, 10), MAX_LIMIT)
}

function normalizePositiveInteger(value: string | boolean | undefined, fallback: number) {
  if (typeof value !== "string") return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toCamelCase(value: string) {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

function printError(message: string) {
  console.error(`canagentsuse: ${message}`)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function shellQuote(value: string) {
  if (!value) return "''"
  if (/^[a-zA-Z0-9._/:=-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

function printHelp() {
  console.log(`canagentsuse ${VERSION}

Find tools an AI agent can actually use.

Usage:
  canagentsuse install [--mcp|--cli|--skill|--all] [--claude|--cursor|--codex|--opencode|--gemini|--universal] [--global|--project] [--yes] [--dry-run]
  canagentsuse setup [--mcp|--cli|--skill|--all] [--claude|--cursor|--codex|--opencode|--gemini|--universal] [--global|--project] [--yes] [--dry-run]
  canagentsuse remove [--mcp|--cli|--skill|--all] [--global|--project] [--yes] [--dry-run]
  canagentsuse status [--json]
  canagentsuse doctor [--json]
  canagentsuse skills list [--json]
  canagentsuse skills install [skill] [--all] [--claude|--cursor|--codex|--opencode|--gemini|--universal] [--global|--project] [--yes] [--dry-run]
  canagentsuse skills remove [skill] [--all] [--global|--project] [--yes] [--dry-run]
  canagentsuse search [query] [--capability slug] [--category slug] [--limit n] [--page n] [--json]
  canagentsuse tool <slug> [--json]
  canagentsuse catalog [--json]
  canagentsuse mcp-config [--json]
  canagentsuse install-guide [--json]
  canagentsuse score-model [--json]
  canagentsuse docs [--json]

Options:
  --site <url>       Override site URL. Defaults to ${DEFAULT_SITE_URL}
  --mcp              Install or remove only the MCP config.
  --cli              Install or remove only CLI skills. Alias for --skill.
  --skill            Install or remove only bundled skills.
  --all              Install/remove both setup modes; for skills, select all bundled skills.
  --global           Install into global user config. This is the default.
  --project          Install into the current project instead of global user config.
  --all-agents       Target every supported agent.
  --yes              Skip confirmation prompts.
  --dry-run          Preview writes and commands without changing files.
  --json, -j         Print JSON for agents and scripts.
  --help, -h         Show help.
  --version, -v      Show version.

Environment:
  CANAGENTSUSE_SITE_URL  Override the default site URL.

Examples:
  canagentsuse setup
  canagentsuse setup --mcp --claude --yes
  canagentsuse setup --cli --cursor --yes
  canagentsuse install --all-agents --yes
  canagentsuse setup --claude --codex --yes
  canagentsuse setup --all-agents --project --dry-run
  canagentsuse doctor
  canagentsuse install-guide --json
  canagentsuse skills install find-mcp-tools --claude --yes
  canagentsuse search stripe
  canagentsuse tool stripe

Agent best practices:
  1. Run "canagentsuse setup --dry-run" before writing config.
  2. Use "canagentsuse setup --all-agents --yes" for a full local install.
  3. Use "canagentsuse setup --mcp --<agent> --yes" when the agent only needs tools.
  4. Use "canagentsuse setup --cli --<agent> --yes" when MCP is unavailable.
  5. Run "canagentsuse doctor --json" after setup and report failed checks.
  6. Use "canagentsuse install-guide --json" when choosing setup paths programmatically.
  7. Prefer "search --json", "tool --json", or "catalog --json" in scripts.
  8. Never ask for database credentials; the CLI uses public read-only surfaces.
`)
}
