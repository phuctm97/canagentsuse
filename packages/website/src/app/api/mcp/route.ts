import {
  agentInterfaceVersion,
  agentJsonHeaders,
  catalogToMarkdown,
  getAgentCatalog,
  getAgentToolBySlug,
  searchAgentTools,
} from "@/lib/agent-catalog"
import { agentInstallLinks, mcpInstallExample } from "@/lib/agent-install"
import { agentScoreWeights } from "@/lib/agent-scoring"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

type JsonRpcId = string | number | null

type JsonRpcRequest = {
  jsonrpc?: string
  id?: JsonRpcId
  method?: string
  params?: unknown
}

type ToolCallParams = {
  name?: string
  arguments?: Record<string, unknown>
}

const protocolVersion = "2025-06-18"
const maxRpcBodyBytes = 32 * 1024
const maxSearchQueryLength = 120
const maxSlugLength = 80

const mcpTools = [
  {
    name: "search_agent_tools",
    title: "Search Agent-Friendly Tools",
    description:
      "Search Can Agents Use for tools by free text, category slug, capability slug, page, and result limit. Results are paginated and include weighted scoreBreakdown and agentTier.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          maxLength: maxSearchQueryLength,
          description: "Search text such as stripe, scraping, cli, mcp, billing, or browser.",
        },
        category: {
          type: "string",
          maxLength: maxSlugLength,
          description: "Optional category slug filter.",
        },
        capability: {
          type: "string",
          maxLength: maxSlugLength,
          description: "Optional capability slug filter.",
        },
        page: {
          type: "integer",
          minimum: 1,
          description: "1-based page number. Defaults to 1.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Results per page. Defaults to 10 and maxes at 50.",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get_agent_catalog",
    title: "Get Full Agent Catalog",
    description:
      "Return the complete Can Agents Use catalog with all tools, categories, capabilities, use cases, weighted scoreBreakdown, and agent guidance. Use this for broad comparison instead of paging through search.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get_agent_tool",
    title: "Get Agent Tool",
    description:
      "Get one Can Agents Use tool record by slug, including weighted scoreBreakdown, evidence, and limitations.",
    inputSchema: {
      type: "object",
      required: ["slug"],
      properties: {
        slug: {
          type: "string",
          maxLength: maxSlugLength,
          description: "Tool slug, for example stripe or github.",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "list_agent_categories",
    title: "List Agent Categories",
    description: "List browsing categories in the Can Agents Use catalog.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "list_agent_capabilities",
    title: "List Agent Capabilities",
    description:
      "List normalized agent affordances such as CLI, API, MCP, browser support, sandbox, and pricing clarity.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: "get_agent_score_model",
    title: "Get Agent Score Model",
    description:
      "Return the weighted signal model used to rank agent friendliness: operability, safety, readability, setup, and reliability.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
]

const resources = [
  {
    uri: "canagentsuse://catalog",
    name: "Can Agents Use catalog",
    description: "Full tool catalog as compact JSON.",
    mimeType: "application/json",
  },
  {
    uri: "canagentsuse://llms-full",
    name: "Can Agents Use full LLM context",
    description: "Expanded Markdown context for long-context agents.",
    mimeType: "text/markdown",
  },
]

export async function GET() {
  return Response.json(
    {
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      protocolVersion,
      endpoint: `${SITE_URL}/api/mcp`,
      transport: "HTTP JSON-RPC",
      install: {
        guide: agentInstallLinks.guide,
        skill: agentInstallLinks.skill,
        configExample: mcpInstallExample,
      },
      capabilities: {
        tools: mcpTools.map(({ name, title, description, inputSchema }) => ({
          name,
          title,
          description,
          inputSchema,
        })),
        resources,
      },
      examples: {
        toolsList: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {},
        },
        search: {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "search_agent_tools",
            arguments: {
              query: "billing cli",
              page: 1,
              limit: 5,
            },
          },
        },
        fullCatalog: {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "get_agent_catalog",
            arguments: {},
          },
        },
      },
    },
    {
      headers: agentJsonHeaders(),
    }
  )
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: agentJsonHeaders({
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    }),
  })
}

export async function POST(request: Request) {
  let body: JsonRpcRequest

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0")

    if (contentLength > maxRpcBodyBytes) {
      return jsonRpcError(null, -32600, "Request too large", 413)
    }

    const rawBody = await request.text()

    if (rawBody.length > maxRpcBodyBytes) {
      return jsonRpcError(null, -32600, "Request too large", 413)
    }

    body = JSON.parse(rawBody) as JsonRpcRequest
  } catch {
    return jsonRpcError(null, -32700, "Parse error")
  }

  if (Array.isArray(body)) {
    return jsonRpcError(null, -32600, "Batch requests are not supported")
  }

  if (!body.id && body.method?.startsWith("notifications/")) {
    return new Response(null, {
      status: 204,
      headers: agentJsonHeaders(),
    })
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return jsonRpcError(body.id ?? null, -32600, "Invalid Request")
  }

  try {
    switch (body.method) {
      case "initialize":
        return jsonRpcResult(body.id ?? null, {
          protocolVersion,
          capabilities: {
            tools: {
              listChanged: false,
            },
            resources: {
              subscribe: false,
              listChanged: false,
            },
          },
          serverInfo: {
            name: "canagentsuse",
            title: SITE_NAME,
            version: agentInterfaceVersion,
          },
          instructions:
            "Use these read-only, cached catalog tools instead of direct database access. Scores are weighted by machine operability, agent safety, readability, setup, and reliability. Search defaults to page 1 with 10 results; request the next page only when hasMore is true. For broad comparison or all records, call get_agent_catalog or read canagentsuse://catalog once instead of paging through search. Keep search queries under 120 characters, request at most 50 results per page, and avoid polling loops. Verify official evidence URLs before irreversible actions.",
        })
      case "ping":
        return jsonRpcResult(body.id ?? null, {})
      case "tools/list":
        return jsonRpcResult(body.id ?? null, {
          tools: mcpTools,
        })
      case "tools/call":
        return handleToolCall(body.id ?? null, body.params)
      case "resources/list":
        return jsonRpcResult(body.id ?? null, {
          resources,
        })
      case "resources/read":
        return handleResourceRead(body.id ?? null, body.params)
      default:
        return jsonRpcError(body.id ?? null, -32601, "Method not found")
    }
  } catch (error) {
    return jsonRpcError(
      body.id ?? null,
      -32603,
      error instanceof Error ? error.message : "Internal error"
    )
  }
}

async function handleToolCall(id: JsonRpcId, params: unknown) {
  const { name, arguments: args = {} } = asToolCallParams(params)

  switch (name) {
    case "search_agent_tools": {
      const result = await searchAgentTools({
        query: asString(args.query),
        category: asString(args.category),
        capability: asString(args.capability),
        page: asNumber(args.page),
        limit: asNumber(args.limit),
      })

      return jsonRpcResult(id, toolResult(result))
    }
    case "get_agent_catalog": {
      const catalog = await getAgentCatalog()

      return jsonRpcResult(id, toolResult(catalog))
    }
    case "get_agent_tool": {
      const slug = asString(args.slug)

      if (!slug) {
        return jsonRpcResult(id, toolError("Missing required argument: slug"))
      }

      const tool = await getAgentToolBySlug(slug)

      if (!tool) {
        return jsonRpcResult(id, toolError(`No tool found for slug: ${slug}`))
      }

      return jsonRpcResult(id, toolResult({ tool }))
    }
    case "list_agent_categories": {
      const catalog = await getAgentCatalog()

      return jsonRpcResult(id, toolResult({ categories: catalog.categories }))
    }
    case "list_agent_capabilities": {
      const catalog = await getAgentCatalog()

      return jsonRpcResult(id, toolResult({ capabilities: catalog.capabilities }))
    }
    case "get_agent_score_model": {
      return jsonRpcResult(id, toolResult({ scoreModel: agentScoreWeights }))
    }
    default:
      return jsonRpcError(id, -32602, `Unknown tool: ${name ?? "missing"}`)
  }
}

async function handleResourceRead(id: JsonRpcId, params: unknown) {
  const uri =
    typeof params === "object" && params !== null && "uri" in params
      ? asString((params as { uri?: unknown }).uri)
      : ""
  const catalog = await getAgentCatalog()

  if (uri === "canagentsuse://catalog") {
    return jsonRpcResult(id, {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(catalog, null, 2),
        },
      ],
    })
  }

  if (uri === "canagentsuse://llms-full") {
    return jsonRpcResult(id, {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: catalogToMarkdown(catalog, { full: true }),
        },
      ],
    })
  }

  return jsonRpcError(id, -32602, `Unknown resource: ${uri || "missing"}`)
}

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id,
      result,
    },
    {
      headers: agentJsonHeaders(),
    }
  )
}

function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  status = code === -32700 ? 400 : 200
) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: agentJsonHeaders(),
    }
  )
}

function toolResult(structuredContent: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent,
    isError: false,
  }
}

function toolError(message: string) {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
  }
}

function asToolCallParams(value: unknown): ToolCallParams {
  if (typeof value !== "object" || value === null) {
    return {}
  }

  return value as ToolCallParams
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined
}
