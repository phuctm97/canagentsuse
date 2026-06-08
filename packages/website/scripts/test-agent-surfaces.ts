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

  console.log("Agent surface tests passed.")
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
  const catalog = await json<Record<string, unknown>>(await catalogGet())
  const tools = readPath(catalog, ["tools"])

  assert(Array.isArray(tools) && tools.length > 1000, "catalog API returns full catalog")
  assert(readPath(catalog, ["site", "endpoints", "installJson"]) === "https://canagentsuse.com/api/agent/install", "catalog advertises install JSON")

  const search = await json<Record<string, unknown>>(
    await searchGet(new Request("https://canagentsuse.test/api/agent/search?q=stripe&page=1&limit=5"))
  )
  assert(readPath(search, ["query"]) === "stripe", "search API normalizes query")
  assert(readPath(search, ["limit"]) === 5, "search API respects limit")
  assertToolSlug(search, "stripe", "search API can find Stripe")

  const stripe = await json<Record<string, unknown>>(
    await toolGet(new Request("https://canagentsuse.test/api/agent/tools/stripe"), {
      params: Promise.resolve({ slug: "stripe" }),
    })
  )
  assert(readPath(stripe, ["tool", "slug"]) === "stripe", "tool API returns Stripe by slug")
  assert(readPath(stripe, ["tool", "scoreBreakdown"]) !== undefined, "tool API returns score breakdown")

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
