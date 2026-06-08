import type {
  DirectoryCapability,
  DirectoryCategory,
  DirectoryData,
  DirectoryTool,
  DirectoryUseCase,
} from "@/lib/directory"
import { agentInstallLinks } from "@/lib/agent-install"
import { getDirectoryData, getToolBySlug } from "@/lib/directory"
import {
  agentScoreWeights,
  type AgentScoreBreakdown,
} from "@/lib/agent-scoring"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const agentInterfaceVersion = "2026-06-07"

export type AgentTool = {
  slug: string
  name: string
  url: string
  websiteUrl: string
  docsUrl: string | null
  githubUrl: string | null
  tagline: string
  shortDescription: string
  agentSummary: string
  bestFor: string
  cautionNotes: string | null
  pricingSummary: string
  authModel: string
  accountCreation: string
  browserSupport: string
  cliPackage: string | null
  apiBaseUrl: string | null
  mcpServer: string | null
  agentScore: number
  agentTier: string
  scoreBreakdown: AgentScoreBreakdown
  launchScore: number
  isFeatured: boolean
  categories: DirectoryCategory[]
  useCases: DirectoryUseCase[]
  capabilities: DirectoryTool["capabilities"]
}

export type AgentCatalog = {
  site: {
    name: string
    description: string
    url: string
    interfaceVersion: string
    source: "catalog-json" | "sample"
    guidance: string[]
    scoreModel: typeof agentScoreWeights
    endpoints: Record<string, string>
  }
  tools: AgentTool[]
  categories: DirectoryCategory[]
  capabilities: DirectoryCapability[]
  useCases: DirectoryUseCase[]
}

export type AgentSearchOptions = {
  query?: string
  category?: string
  capability?: string
  limit?: number
  page?: number
}

const defaultLimit = 10
const maxLimit = 50
const maxQueryLength = 120
const maxSlugLength = 80

export function agentJsonHeaders(extra?: HeadersInit) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    ...extra,
  }
}

export async function getAgentCatalog(): Promise<AgentCatalog> {
  const data = await getDirectoryData()

  return toAgentCatalog(data)
}

export async function getAgentToolBySlug(slug: string) {
  const tool = await getToolBySlug(normalizeSlug(slug))

  return tool ? toAgentTool(tool) : null
}

export async function searchAgentTools(options: AgentSearchOptions) {
  const catalog = await getAgentCatalog()
  const query = normalizeQuery(options.query)
  const category = normalizeSlug(options.category)
  const capability = normalizeSlug(options.capability)
  const limit = clampLimit(options.limit)
  const requestedPage = clampPage(options.page)

  const rankedTools = catalog.tools
    .map((tool) => ({
      tool,
      rank: scoreTool(tool, query, category, capability),
    }))
    .filter(({ rank }) => rank > 0)
    .sort((left, right) => right.rank - left.rank || right.tool.agentScore - left.tool.agentScore)
    .map(({ tool }) => tool)
  const total = rankedTools.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const page = total === 0 ? 1 : Math.min(requestedPage, totalPages)
  const offset = (page - 1) * limit
  const tools = rankedTools
    .slice(offset, offset + limit)

  return {
    query,
    category,
    capability,
    page,
    limit,
    count: tools.length,
    total,
    totalPages,
    hasMore: page < totalPages,
    tools,
  }
}

export function catalogToMarkdown(catalog: AgentCatalog, options?: { full?: boolean }) {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Can Agents Use is designed for both people and software agents. Prefer the agent interfaces below before scraping pages or touching a database. The public API, OpenAPI document, and MCP endpoint are read-only catalog surfaces.",
    "",
    "## Agent Interfaces",
    "",
    `- [Install guide](${agentInstallLinks.guide}): Human-readable guide for adding Can Agents Use to an agent with the CLI, MCP, skills, or direct JSON APIs.`,
    `- [CLI installer](https://www.npmjs.com/package/canagentsuse): Run \`npx canagentsuse@latest setup --all-agents --yes\` to install MCP config plus bundled skills for supported agents.`,
    `- [skills.sh skill](${agentInstallLinks.skillSource}): Fallback install path with \`npx skills add phuctm97/canagentsuse --skill can-agents-use\`.`,
    `- [Skill Markdown](${agentInstallLinks.skill}): Copyable SKILL.md-style fallback for agents that support persistent skills.`,
    `- [Catalog JSON](${SITE_URL}/api/agent/catalog): Full structured catalog with tools, categories, capabilities, and use cases.`,
    `- [Search JSON](${SITE_URL}/api/agent/search?q=stripe&page=1&limit=10): Query tools by name, category, capability, pricing, auth, docs, CLI, API, MCP, and browser support.`,
    `- [Tool JSON](${SITE_URL}/api/agent/tools/stripe): Stable per-tool record; replace "stripe" with any tool slug.`,
    `- [MCP endpoint](${SITE_URL}/api/mcp): Read-only JSON-RPC endpoint for agent clients that support MCP-style tool discovery and calls.`,
    `- [OpenAPI](${SITE_URL}/openapi.json): Machine-readable HTTP API contract.`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): Human-readable pages for search and browsing.`,
    "",
    "## How To Use This Site As An Agent",
    "",
    "- Use `search_agent_tools` over MCP or `/api/agent/search` to discover candidates.",
    "- Search results are paginated; default to `limit=10` and request the next `page` only when `hasMore` is true.",
    "- For complete information, call MCP `get_agent_catalog`, read MCP resource `canagentsuse://catalog`, or fetch `/api/agent/catalog` once per session.",
    "- Avoid paging through search when you need all records; fetch the full catalog and search locally in agent context.",
    "- Use `get_agent_tool` or `/api/agent/tools/{slug}` before recommending a tool.",
    "- Requests are read-only, cached, and bounded; never ask for or use database credentials.",
    "- Treat scores and summaries as discovery signals, not legal, security, or purchasing approval.",
    "- Check evidence URLs and official docs before taking irreversible action, spending money, or moving live customer data.",
    "",
    "## Agent-Friendliness Score Model",
    "",
    ...agentScoreWeights.map(
      (group) =>
        `- ${group.label}: ${group.weight}% (${group.signals
          .map((signal) => signal.label)
          .join(", ")})`
    ),
  ]

  if (options?.full) {
    lines.push(
      "",
      "## Categories",
      "",
      ...catalog.categories.flatMap((category) => [
        `- ${category.name} (${category.slug}): ${category.description}`,
      ]),
      "",
      "## Capabilities",
      "",
      ...catalog.capabilities.flatMap((capability) => [
        `- ${capability.name} (${capability.slug}): ${capability.description}`,
      ]),
      "",
      "## Tools",
      ""
    )

    for (const tool of catalog.tools) {
      lines.push(
        `### ${tool.name}`,
        "",
        `- Slug: ${tool.slug}`,
        `- URL: ${tool.url}`,
        `- Website: ${tool.websiteUrl}`,
        `- Docs: ${tool.docsUrl ?? "Not listed"}`,
        `- Agent score: ${tool.agentScore}`,
        `- Agent tier: ${tool.agentTier}`,
        `- Categories: ${tool.categories.map((item) => item.name).join(", ")}`,
        `- Use cases: ${tool.useCases.map((item) => item.name).join(", ")}`,
        `- Best for: ${tool.bestFor}`,
        `- Limitations: ${tool.cautionNotes ?? "Not listed"}`,
        `- Pricing: ${tool.pricingSummary}`,
        `- Auth: ${tool.authModel}`,
        `- Account creation: ${tool.accountCreation}`,
        `- Browser support: ${tool.browserSupport}`,
        `- CLI: ${tool.cliPackage ?? "Not listed"}`,
        `- API base: ${tool.apiBaseUrl ?? "Not listed"}`,
        `- MCP server: ${tool.mcpServer ?? "Not listed"}`,
        "",
        tool.agentSummary,
        "",
        "Score breakdown:",
        ...tool.scoreBreakdown.groups.map(
          (group) => `- ${group.label}: ${group.score}/${group.maxScore}`
        ),
        "",
        "Capabilities:",
        ...tool.capabilities.map(
          (capability) =>
            `- ${capability.name}: ${capability.supportLevel}. ${capability.detail}${
              capability.evidenceUrl ? ` Evidence: ${capability.evidenceUrl}` : ""
            }`
        ),
        ""
      )
    }
  } else {
    lines.push(
      "",
      "## Core Pages",
      "",
      `- [Home](${SITE_URL}/): Human directory with command search.`,
      `- [Submit](${SITE_URL}/submit): Suggest a new agent-friendly tool.`,
      "",
      "## Optional",
      "",
      `- [Full LLM context](${SITE_URL}/llms-full.txt): Expanded catalog summaries for long-context agents.`
    )
  }

  return `${lines.join("\n")}\n`
}

export function openApiDocument(catalog: AgentCatalog) {
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} Agent API`,
      version: agentInterfaceVersion,
      description:
        "Read-only catalog API for agents searching for agent-friendly software tools.",
    },
    servers: [{ url: SITE_URL }],
    paths: {
      "/api/agent/catalog": {
        get: {
          summary: "Get the full agent-readable catalog",
          operationId: "getAgentCatalog",
          responses: successResponse("AgentCatalog"),
        },
      },
      "/api/agent/search": {
        get: {
          summary: "Search agent-friendly tools",
          operationId: "searchAgentTools",
          parameters: [
            queryParam("q", "Free text query"),
            queryParam("category", "Category slug filter"),
            queryParam("capability", "Capability slug filter"),
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "1-based result page. Defaults to 1.",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: maxLimit, default: defaultLimit },
              description: "Results per page. Defaults to 10 and maxes at 50.",
            },
          ],
          responses: successResponse("AgentSearchResult"),
        },
      },
      "/api/agent/tools/{slug}": {
        get: {
          summary: "Get one tool by slug",
          operationId: "getAgentTool",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: {
                type: "string",
                maxLength: maxSlugLength,
                enum: catalog.tools.map((tool) => tool.slug),
              },
            },
          ],
          responses: {
            ...successResponse("AgentToolEnvelope"),
            "404": {
              description: "Tool not found",
            },
          },
        },
      },
      "/api/mcp": {
        post: {
          summary: "Call the read-only MCP-style JSON-RPC endpoint",
          operationId: "callMcpEndpoint",
          description:
            "Supports initialize, ping, tools/list, tools/call, resources/list, and resources/read for the Can Agents Use catalog.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/JsonRpcRequest" },
                examples: {
                  listTools: {
                    summary: "List MCP tools",
                    value: {
                      jsonrpc: "2.0",
                      id: 1,
                      method: "tools/list",
                      params: {},
                    },
                  },
                  searchTools: {
                    summary: "Search agent-friendly tools",
                    value: {
                      jsonrpc: "2.0",
                      id: 2,
                      method: "tools/call",
                      params: {
                        name: "search_agent_tools",
                        arguments: {
                          query: "stripe",
                          page: 1,
                          limit: 10,
                        },
                      },
                    },
                  },
                  readCatalog: {
                    summary: "Read the full catalog resource",
                    value: {
                      jsonrpc: "2.0",
                      id: 3,
                      method: "resources/read",
                      params: {
                        uri: "canagentsuse://catalog",
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "JSON-RPC result or JSON-RPC error envelope.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/JsonRpcResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        AgentCatalog: {
          type: "object",
          required: ["site", "tools", "categories", "capabilities", "useCases"],
          properties: {
            site: { type: "object" },
            tools: { type: "array", items: { $ref: "#/components/schemas/AgentTool" } },
            categories: { type: "array", items: { type: "object" } },
            capabilities: { type: "array", items: { type: "object" } },
            useCases: { type: "array", items: { type: "object" } },
          },
        },
        AgentSearchResult: {
          type: "object",
          required: [
            "query",
            "category",
            "capability",
            "page",
            "limit",
            "count",
            "total",
            "totalPages",
            "hasMore",
            "tools",
          ],
          properties: {
            query: { type: "string" },
            category: { type: "string" },
            capability: { type: "string" },
            page: { type: "integer" },
            limit: { type: "integer" },
            count: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
            hasMore: { type: "boolean" },
            tools: { type: "array", items: { $ref: "#/components/schemas/AgentTool" } },
          },
        },
        AgentToolEnvelope: {
          type: "object",
          required: ["tool"],
          properties: {
            tool: { $ref: "#/components/schemas/AgentTool" },
          },
        },
        AgentTool: {
          type: "object",
          required: [
            "slug",
            "name",
            "url",
            "websiteUrl",
            "tagline",
            "shortDescription",
            "agentSummary",
            "agentScore",
            "agentTier",
            "scoreBreakdown",
            "categories",
            "capabilities",
          ],
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            url: { type: "string", format: "uri" },
            websiteUrl: { type: "string", format: "uri" },
            docsUrl: { type: ["string", "null"], format: "uri" },
            githubUrl: { type: ["string", "null"], format: "uri" },
            tagline: { type: "string" },
            shortDescription: { type: "string" },
            agentSummary: { type: "string" },
            bestFor: { type: "string" },
            cautionNotes: {
              type: ["string", "null"],
              description:
                "Human and agent-readable limitations, risks, and review requirements for operating this tool.",
            },
            pricingSummary: { type: "string" },
            authModel: { type: "string" },
            accountCreation: { type: "string" },
            browserSupport: { type: "string" },
            cliPackage: { type: ["string", "null"] },
            apiBaseUrl: { type: ["string", "null"] },
            mcpServer: { type: ["string", "null"] },
            agentScore: { type: "integer" },
            agentTier: { type: "string" },
            scoreBreakdown: { type: "object" },
            launchScore: { type: "integer" },
            isFeatured: { type: "boolean" },
            categories: { type: "array", items: { type: "object" } },
            useCases: { type: "array", items: { type: "object" } },
            capabilities: { type: "array", items: { type: "object" } },
          },
        },
        JsonRpcRequest: {
          type: "object",
          required: ["jsonrpc", "method"],
          additionalProperties: true,
          properties: {
            jsonrpc: { type: "string", const: "2.0" },
            id: {
              oneOf: [
                { type: "string" },
                { type: "number" },
                { type: "null" },
              ],
            },
            method: {
              type: "string",
              enum: [
                "initialize",
                "ping",
                "tools/list",
                "tools/call",
                "resources/list",
                "resources/read",
              ],
            },
            params: { type: "object", additionalProperties: true },
          },
        },
        JsonRpcResponse: {
          type: "object",
          required: ["jsonrpc", "id"],
          additionalProperties: true,
          properties: {
            jsonrpc: { type: "string", const: "2.0" },
            id: {
              oneOf: [
                { type: "string" },
                { type: "number" },
                { type: "null" },
              ],
            },
            result: { type: "object", additionalProperties: true },
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "integer" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  }
}

function toAgentCatalog(data: DirectoryData): AgentCatalog {
  return {
    site: {
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      interfaceVersion: agentInterfaceVersion,
      source: data.isFallback ? "sample" : "catalog-json",
      guidance: [
        "Use public read-only endpoints instead of database access.",
        "For bulk context, fetch /api/agent/catalog or /llms-full.txt once and search locally.",
        "Do not poll search endpoints on every token or loop iteration; cache results in the agent session.",
        "Prefer official evidence URLs before making recommendations.",
        "Use caution notes for live money, production data, account, and compliance workflows.",
      ],
      scoreModel: agentScoreWeights,
      endpoints: {
        llms: `${SITE_URL}/llms.txt`,
        llmsFull: `${SITE_URL}/llms-full.txt`,
        installGuide: agentInstallLinks.guide,
        skill: agentInstallLinks.skill,
        catalog: `${SITE_URL}/api/agent/catalog`,
        search: `${SITE_URL}/api/agent/search`,
        tool: `${SITE_URL}/api/agent/tools/{slug}`,
        mcp: `${SITE_URL}/api/mcp`,
        openapi: `${SITE_URL}/openapi.json`,
      },
    },
    tools: data.tools.map(toAgentTool),
    categories: data.categories,
    capabilities: data.capabilities,
    useCases: data.useCases,
  }
}

function toAgentTool(tool: DirectoryTool): AgentTool {
  return {
    slug: tool.slug,
    name: tool.name,
    url: `${SITE_URL}/tools/${tool.slug}`,
    websiteUrl: tool.websiteUrl,
    docsUrl: tool.docsUrl ?? null,
    githubUrl: tool.githubUrl ?? null,
    tagline: tool.tagline,
    shortDescription: tool.shortDescription,
    agentSummary: tool.agentSummary,
    bestFor: tool.bestFor,
    cautionNotes: tool.cautionNotes ?? null,
    pricingSummary: tool.pricingSummary,
    authModel: tool.authModel,
    accountCreation: tool.accountCreation,
    browserSupport: tool.browserSupport,
    cliPackage: tool.cliPackage ?? null,
    apiBaseUrl: tool.apiBaseUrl ?? null,
    mcpServer: tool.mcpServer ?? null,
    agentScore: tool.agentScore,
    agentTier: tool.agentTier,
    scoreBreakdown: tool.scoreBreakdown,
    launchScore: tool.launchScore,
    isFeatured: tool.isFeatured,
    categories: tool.categories,
    useCases: tool.useCases,
    capabilities: tool.capabilities,
  }
}

function scoreTool(tool: AgentTool, query: string, category: string, capability: string) {
  if (category && !tool.categories.some((item) => item.slug === category)) {
    return 0
  }

  if (capability && !tool.capabilities.some((item) => item.slug === capability)) {
    return 0
  }

  if (!query) {
    return tool.agentScore
  }

  const queryTokens = tokenizeQuery(query)
  const haystack = [
    tool.slug,
    tool.name,
    tool.tagline,
    tool.shortDescription,
    tool.agentSummary,
    tool.bestFor,
    tool.pricingSummary,
    tool.authModel,
    tool.accountCreation,
    tool.browserSupport,
    tool.cliPackage,
    tool.apiBaseUrl,
    tool.mcpServer,
    ...tool.categories.flatMap((item) => [item.slug, item.name, item.description]),
    ...tool.useCases.flatMap((item) => [item.slug, item.name, item.description]),
    ...tool.capabilities.flatMap((item) => [
      item.slug,
      item.name,
      item.group,
      item.supportLevel,
      item.detail,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const phraseMatch = haystack.includes(query)
  const tokenMatch =
    queryTokens.length > 0 && queryTokens.every((token) => haystack.includes(token))

  if (!phraseMatch && !tokenMatch) {
    return 0
  }

  let rank = tool.agentScore
  if (normalizeSlug(tool.slug) === query) rank += 1000
  if (normalizeQuery(tool.name) === query) rank += 800
  if (normalizeQuery(tool.name).includes(query)) rank += 200
  if (normalizeQuery(tool.tagline).includes(query)) rank += 100
  if (phraseMatch) rank += 75
  rank += queryTokens.filter((token) => haystack.includes(token)).length * 20

  return rank
}

function normalizeQuery(value?: string | null) {
  return normalize(value, maxQueryLength)
}

function normalizeSlug(value?: string | null) {
  return normalize(value, maxSlugLength)
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, maxSlugLength)
}

function normalize(value: string | null | undefined, maxLength: number) {
  return value?.trim().toLowerCase().slice(0, maxLength) ?? ""
}

function tokenizeQuery(query: string) {
  return query
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

function clampLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return defaultLimit
  }

  return Math.min(Math.max(Math.trunc(limit), 1), maxLimit)
}

function clampPage(page?: number) {
  if (!page || Number.isNaN(page)) {
    return 1
  }

  return Math.max(Math.trunc(page), 1)
}

function queryParam(name: string, description: string) {
  const maxLength = name === "q" ? maxQueryLength : maxSlugLength

  return {
    name,
    in: "query",
    required: false,
    description,
    schema: { type: "string", maxLength },
  }
}

function successResponse(schemaName: string) {
  return {
    "200": {
      description: "Successful response",
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${schemaName}`,
          },
        },
      },
    },
  }
}
