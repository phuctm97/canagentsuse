import { readFile, readdir } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { GET as catalogGet } from "../src/app/api/agent/catalog/route"
import { GET as installGet } from "../src/app/api/agent/install/route"
import { GET as searchGet } from "../src/app/api/agent/search/route"
import { GET as toolGet } from "../src/app/api/agent/tools/[slug]/route"
import { GET as mcpDescriptorGet, POST as mcpPost } from "../src/app/api/mcp/route"
import { GET as openApiGet } from "../src/app/openapi.json/route"
import { GET as skillGet } from "../src/app/skill.md/route"
import { canAgentsUseSkillMarkdown } from "../src/lib/agent-install"
import { getDirectoryListData } from "../src/lib/directory"
import {
  buildSubmitToolAgentPrompt,
  buildSubmitToolBranchName,
  buildSubmitToolPrBody,
  buildUpdateToolAgentPrompt,
  buildUpdateToolBranchName,
  buildUpdateToolPrBody,
  emptySubmitToolInput,
} from "../src/lib/submit-tool"
import {
  formatExactTokenCount,
  formatTokenCount,
  tokenSavings,
  tokenSavingsBenchmark,
} from "../src/lib/token-savings"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const rootSkillsDir = join(repoRoot, "skills")
const cliSkillsDir = join(repoRoot, "packages/cli/skills")

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

async function main() {
  await testInstallApi()
  await testCatalogSearchAndToolApi()
  await testMcpSurface()
  await testOpenApiSurface()
  await testSkillSurface()
  await testSubmitToolTemplate()
  testTokenSavingsBenchmark()

  console.log("Agent surface tests passed.")
}

function testTokenSavingsBenchmark() {
  assert(
    tokenSavingsBenchmark.normalSearch.tokens >
      tokenSavingsBenchmark.canAgentsUse.tokens,
    "token benchmark saves context"
  )
  assert(
    tokenSavings.tokens ===
      tokenSavingsBenchmark.normalSearch.tokens -
        tokenSavingsBenchmark.canAgentsUse.tokens,
    "token savings is derived from measured inputs"
  )
  assert(
    tokenSavings.tokens === 9766,
    "token benchmark preserves measured saved tokens"
  )
  assert(
    tokenSavings.percent === 42,
    "token benchmark preserves measured percent"
  )
  assert(
    formatTokenCount(tokenSavings.tokens) === "9.8K",
    "token savings display is compact"
  )
  assert(
    formatExactTokenCount(tokenSavings.tokens) === "9,766",
    "token savings exact display is formatted"
  )
  assert(
    tokenSavingsBenchmark.query === "billing API sandbox pricing caution notes",
    "token benchmark preserves the displayed query"
  )
  assert(
    tokenSavingsBenchmark.normalSearch.output.includes("Official pages") &&
      tokenSavingsBenchmark.canAgentsUse.output.includes("Search JSON"),
    "token benchmark preserves simple output comparison"
  )
  assert(
    tokenSavingsBenchmark.canAgentsUse.results.join(", ") ===
      "FOSSBilling, Stripe, Paddle",
    "token benchmark preserves displayed Can Agents Use results"
  )
  assert(
    tokenSavingsBenchmark.normalSearch.sources.length >= 3,
    "token benchmark lists normal-search sources"
  )
  assert(
    tokenSavingsBenchmark.canAgentsUse.sources.includes(
      "/api/agent/search?q=billing&capability=api&limit=3"
    ),
    "token benchmark lists bounded search call"
  )
}

async function testSubmitToolTemplate() {
  const addTemplate = await readFile(
    join(repoRoot, ".github/PULL_REQUEST_TEMPLATE/add-tool.md"),
    "utf8"
  )
  const updateTemplate = await readFile(
    join(repoRoot, ".github/PULL_REQUEST_TEMPLATE/update-tool.md"),
    "utf8"
  )

  assert(
    buildSubmitToolPrBody(emptySubmitToolInput) === addTemplate.trimEnd(),
    "submit tool PR body matches GitHub add-tool template"
  )
  assert(
    buildUpdateToolPrBody(emptySubmitToolInput) === updateTemplate.trimEnd(),
    "update tool PR body matches GitHub update-tool template"
  )
  assert(
    !addTemplate.includes("`agentScore` (0-100):") &&
      !updateTemplate.includes("`agentScore` (0-100):"),
    "submit template does not ask users to enter agentScore"
  )
  assert(
    !addTemplate.includes("`launchScore` (0+):") &&
      !updateTemplate.includes("`launchScore` (0+):"),
    "submit template does not ask users to enter launchScore"
  )
  assert(
    addTemplate.includes("`launchSignals`:"),
    "submit template asks users for launchSignals"
  )
  assert(
    updateTemplate.includes("## Existing Tool") &&
      updateTemplate.includes("- Existing slug:") &&
      updateTemplate.includes("- Why this is more accurate:"),
    "update template supports existing tool updates"
  )
  assert(
    addTemplate.includes("`logoPath` (optional): `/logos/tools/<slug>.svg`") &&
      addTemplate.includes("packages/website/public/logos/tools/<slug>.svg") &&
      addTemplate.includes("packages/website/public/logos/tools/stripe.svg") &&
      addTemplate.includes("If no logo is added, omit `logoPath`"),
    "submit template documents optional slug-named SVG logos"
  )
  assert(
    addTemplate.includes("## Signal Honesty") &&
      addTemplate.includes("Do not fake or inflate") &&
      updateTemplate.includes("## Signal Honesty") &&
      updateTemplate.includes("Do not fake or inflate"),
    "submit template requires honest launch signals"
  )
  assert(
    addTemplate.includes("`bun run catalog:build`") &&
      updateTemplate.includes("`bun run catalog:build`"),
    "submit and update templates ask users to build the catalog"
  )
  assert(
    addTemplate.includes("`data/catalog.json`") &&
      updateTemplate.includes("`data/catalog.json`"),
    "submit and update templates warn users not to edit generated catalog"
  )

  const updateInput = {
    ...emptySubmitToolInput,
    toolName: "stripe",
    notes: "Refresh launch signals from public evidence.",
  }
  const submitPrompt = buildSubmitToolAgentPrompt(updateInput)
  const updatePrompt = buildUpdateToolAgentPrompt(updateInput)

  assert(
    buildSubmitToolBranchName(updateInput.toolName) === "catalog/add-stripe",
    "submit flow uses add branch prefix"
  )

  assert(
    buildUpdateToolBranchName(updateInput.toolName) === "catalog/update-stripe",
    "update flow uses update branch prefix"
  )
  assert(
    submitPrompt.includes("using `.github/PULL_REQUEST_TEMPLATE/add-tool.md`") &&
      !submitPrompt.includes("update-tool.md"),
    "submit prompt uses add-tool template"
  )
  assert(
    updatePrompt.includes("Please update an existing agent-friendly tool") &&
      updatePrompt.includes("Do not add a duplicate tool record.") &&
      updatePrompt.includes("using `.github/PULL_REQUEST_TEMPLATE/update-tool.md`"),
    "update prompt preserves PR-only existing-record workflow"
  )
}

async function testInstallApi() {
  const guide = await json<Record<string, unknown>>(await installGet())

  assert(readPath(guide, ["site", "name"]) === "Can Agents Use", "install API has site name")
  assert(
    readPath(guide, ["cli", "fullSetup"]) === "npx canagentsuse@latest setup --all-agents --yes",
    "install API has full CLI setup command"
  )
  assertArrayIncludes(readPath(guide, ["mcp", "tools"]), "get_agent_install_guide", "install API MCP tools")
  assertArrayIncludes(readPath(guide, ["mcp", "resources"]), "canagentsuse://install", "install API MCP resources")
  assert(
    readPath(guide, ["api", "install"]) === "https://canagentsuse.com/api/agent/install",
    "install API links to itself"
  )
  assertArrayIncludes(readPath(guide, ["guardrails"]), "Do not request database credentials; all agent surfaces are public, cached, and read-only.", "install API guardrails")
}

async function testCatalogSearchAndToolApi() {
  const directory = await getDirectoryListData()
  assertToolsSortedByScore(directory.tools, "website directory tools")

  const catalog = await json<Record<string, unknown>>(await catalogGet())
  const tools = readPath(catalog, ["tools"])

  assert(Array.isArray(tools) && tools.length > 1000, "catalog API returns full catalog")
  assertToolsSortedByScore(tools, "catalog API tools")
  assert(readPath(catalog, ["site", "endpoints", "installJson"]) === "https://canagentsuse.com/api/agent/install", "catalog advertises install JSON")

  const topSearch = await json<Record<string, unknown>>(
    await searchGet(new Request("https://canagentsuse.test/api/agent/search?page=1&limit=10"))
  )
  assertToolsSortedByScore(readPath(topSearch, ["tools"]), "search API top tools")

  const search = await json<Record<string, unknown>>(
    await searchGet(new Request("https://canagentsuse.test/api/agent/search?q=stripe&page=1&limit=5"))
  )
  assert(readPath(search, ["query"]) === "stripe", "search API normalizes query")
  assert(readPath(search, ["limit"]) === 5, "search API respects limit")
  assertToolSlug(search, "stripe", "search API can find Stripe")
  assertFirstToolSlug(search, "stripe", "search API ranks exact name match first")

  const exactNameSearch = await json<Record<string, unknown>>(
    await searchGet(
      new Request("https://canagentsuse.test/api/agent/search?q=make%20a%20website&page=1&limit=5")
    )
  )
  assertToolSlug(exactNameSearch, "make-a-website", "search API can find Make A Website")
  assertFirstToolSlug(
    exactNameSearch,
    "make-a-website",
    "search API ranks exact multi-word name match first"
  )

  const stripe = await json<Record<string, unknown>>(
    await toolGet(new Request("https://canagentsuse.test/api/agent/tools/stripe"), {
      params: Promise.resolve({ slug: "stripe" }),
    })
  )
  assert(readPath(stripe, ["tool", "slug"]) === "stripe", "tool API returns Stripe by slug")
  assert(readPath(stripe, ["tool", "scoreBreakdown"]) !== undefined, "tool API returns score breakdown")
  assert(
    readPath(stripe, ["tool", "agentScore"]) === readPath(stripe, ["tool", "scoreBreakdown", "score"]),
    "tool API derives agentScore from score breakdown"
  )
  assert(
    readPath(stripe, ["tool", "launchScore"]) === readPath(stripe, ["tool", "launchScoreBreakdown", "score"]),
    "tool API derives launchScore from launch score breakdown"
  )

  const missing = await toolGet(new Request("https://canagentsuse.test/api/agent/tools/nope"), {
    params: Promise.resolve({ slug: "not-a-real-tool" }),
  })
  assert(missing.status === 404, "tool API returns 404 for missing slug")
}

async function testMcpSurface() {
  const descriptor = await json<Record<string, unknown>>(await mcpDescriptorGet())

  assert(readPath(descriptor, ["install", "guideJson"]) === "https://canagentsuse.com/api/agent/install", "MCP descriptor links install JSON")
  assertNamedItem(readPath(descriptor, ["capabilities", "tools"]), "get_agent_install_guide", "MCP descriptor lists install guide tool")
  assertNamedItem(readPath(descriptor, ["capabilities", "resources"]), "canagentsuse://install", "MCP descriptor lists install resource", "uri")

  const toolsList = await mcp({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
  assertNamedItem(readPath(toolsList, ["result", "tools"]), "search_agent_tools", "MCP tools/list includes search")
  assertNamedItem(readPath(toolsList, ["result", "tools"]), "get_agent_install_guide", "MCP tools/list includes install guide")

  const installGuide = await mcp({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "get_agent_install_guide",
      arguments: {},
    },
  })
  assert(
    readPath(installGuide, ["result", "structuredContent", "cli", "doctor"]) === "npx canagentsuse@latest doctor",
    "MCP install guide tool returns structured CLI guidance"
  )

  const catalogTool = await mcp({
    jsonrpc: "2.0",
    id: 20,
    method: "tools/call",
    params: {
      name: "get_agent_catalog",
      arguments: {},
    },
  })
  assertToolsSortedByScore(
    readPath(catalogTool, ["result", "structuredContent", "tools"]),
    "MCP catalog tool tools"
  )

  const search = await mcp({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "search_agent_tools",
      arguments: {
        query: "stripe",
        limit: 3,
      },
    },
  })
  assertToolSlug(readPath(search, ["result", "structuredContent"]), "stripe", "MCP search finds Stripe")
  assertFirstToolSlug(
    readPath(search, ["result", "structuredContent"]),
    "stripe",
    "MCP search ranks exact name match first"
  )

  const exactNameSearch = await mcp({
    jsonrpc: "2.0",
    id: 30,
    method: "tools/call",
    params: {
      name: "search_agent_tools",
      arguments: {
        query: "make a website",
        limit: 5,
      },
    },
  })
  assertToolSlug(
    readPath(exactNameSearch, ["result", "structuredContent"]),
    "make-a-website",
    "MCP search finds Make A Website"
  )
  assertFirstToolSlug(
    readPath(exactNameSearch, ["result", "structuredContent"]),
    "make-a-website",
    "MCP search ranks exact multi-word name match first"
  )

  const resource = await mcp({
    jsonrpc: "2.0",
    id: 4,
    method: "resources/read",
    params: {
      uri: "canagentsuse://install",
    },
  })
  const contents = readPath(resource, ["result", "contents"])
  assert(Array.isArray(contents), "MCP install resource returns contents")
  const first = contents[0] as Record<string, unknown>
  assert(first.mimeType === "application/json", "MCP install resource is JSON")
  const parsed = JSON.parse(String(first.text)) as Record<string, unknown>
  assert(readPath(parsed, ["skills", "primarySkill"]) === "can-agents-use", "MCP install resource includes primary skill")

  const catalogResource = await mcp({
    jsonrpc: "2.0",
    id: 6,
    method: "resources/read",
    params: {
      uri: "canagentsuse://catalog",
    },
  })
  const catalogContents = readPath(catalogResource, ["result", "contents"])
  assert(Array.isArray(catalogContents), "MCP catalog resource returns contents")
  const catalogFirst = catalogContents[0] as Record<string, unknown>
  assert(catalogFirst.mimeType === "application/json", "MCP catalog resource is JSON")
  const parsedCatalog = JSON.parse(String(catalogFirst.text)) as Record<string, unknown>
  assertToolsSortedByScore(readPath(parsedCatalog, ["tools"]), "MCP catalog resource tools")

  const missingTool = await mcp({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "get_agent_tool",
      arguments: {},
    },
  })
  assert(readPath(missingTool, ["result", "isError"]) === true, "MCP tool validates required slug")
}

async function testOpenApiSurface() {
  const doc = await json<Record<string, unknown>>(await openApiGet())

  assert(readPath(doc, ["info", "version"]) === "2026-06-08", "OpenAPI exposes current agent interface version")
  assert(readPath(doc, ["paths", "/api/agent/install"]) !== undefined, "OpenAPI lists install API")
  assert(readPath(doc, ["components", "schemas", "AgentInstallGuide"]) !== undefined, "OpenAPI has install guide schema")
  assert(
    readPath(doc, ["paths", "/api/mcp", "post", "requestBody", "content", "application/json", "examples", "readInstallGuide"]) !== undefined,
    "OpenAPI has MCP install resource example"
  )
}

async function testSkillSurface() {
  const generatedSkill = canAgentsUseSkillMarkdown()
  const skillResponse = await skillGet()
  const skillText = await skillResponse.text()
  const rootSkill = await readFile(join(rootSkillsDir, "can-agents-use/SKILL.md"), "utf8")
  const cliSkill = await readFile(join(cliSkillsDir, "can-agents-use/SKILL.md"), "utf8")

  assert(skillResponse.headers.get("content-type")?.includes("text/markdown"), "skill route returns Markdown")
  assert(skillText === generatedSkill, "skill route matches generated skill")
  assert(rootSkill === generatedSkill, "root can-agents-use skill matches generator")
  assert(cliSkill === rootSkill, "CLI bundled can-agents-use skill is synced")

  for (const requiredText of [
    "https://canagentsuse.com/api/agent/install",
    "get_agent_install_guide",
    "canagentsuse://install",
    "canagentsuse install-guide --json",
  ]) {
    assert(rootSkill.includes(requiredText), `can-agents-use skill includes ${requiredText}`)
  }

  await assertSkillDirectory(rootSkillsDir)
  await assertSkillDirectory(cliSkillsDir)
}

async function assertSkillDirectory(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true })
  const skillNames = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()

  assert(skillNames.length >= 8, `${directory} has focused skills`)

  for (const skillName of skillNames) {
    const file = join(directory, skillName, "SKILL.md")
    const text = await readFile(file, "utf8")
    const frontmatter = parseFrontmatter(text)

    assert(frontmatter.name === skillName, `${file} frontmatter name matches folder`)
    assert(Boolean(frontmatter.description), `${file} has description`)
  }
}

async function mcp(body: Record<string, unknown>) {
  return json<Record<string, unknown>>(
    await mcpPost(
      new Request("https://canagentsuse.test/api/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      })
    )
  )
}

async function json<T>(response: Response): Promise<T> {
  assert(response.ok, `response was not OK: ${response.status}`)
  return response.json() as Promise<T>
}

function assertToolSlug(value: unknown, slug: string, message: string) {
  const tools = readPath(value, ["tools"])
  assert(
    Array.isArray(tools) && tools.some((tool) => readPath(tool, ["slug"]) === slug),
    message
  )
}

function assertFirstToolSlug(value: unknown, slug: string, message: string) {
  const tools = readPath(value, ["tools"])
  assert(
    Array.isArray(tools) && readPath(tools[0], ["slug"]) === slug,
    message
  )
}

function assertToolsSortedByScore(value: unknown, label: string) {
  assert(Array.isArray(value), `${label} is an array`)

  for (let index = 1; index < value.length; index += 1) {
    const previousScore = readPath(value[index - 1], ["agentScore"])
    const currentScore = readPath(value[index], ["agentScore"])

    assert(typeof previousScore === "number", `${label} item ${index} has previous score`)
    assert(typeof currentScore === "number", `${label} item ${index + 1} has score`)
    assert(
      previousScore >= currentScore,
      `${label} is sorted by descending agentScore at positions ${index} and ${index + 1}`
    )
  }
}

function assertNamedItem(value: unknown, expected: string, message: string, key = "name") {
  assert(
    Array.isArray(value) && value.some((item) => readPath(item, [key]) === expected),
    message
  )
}

function assertArrayIncludes(value: unknown, expected: string, message: string) {
  assert(Array.isArray(value) && value.includes(expected), `${message} includes ${expected}`)
}

function readPath(value: unknown, keys: string[]): unknown {
  let current = value
  for (const key of keys) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function parseFrontmatter(text: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(text)
  assert(Boolean(match), "skill has frontmatter")

  return Object.fromEntries(
    match![1]
      .split("\n")
      .map((line) => line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/))
      .filter((line): line is RegExpMatchArray => Boolean(line))
      .map((line) => [line[1], line[2].replace(/^["']|["']$/g, "")])
  )
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
