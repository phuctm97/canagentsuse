# Can Agents Use

[![skills.sh](https://skills.sh/b/phuctm97/canagentsuse)](https://skills.sh/phuctm97/canagentsuse)

Find tools an AI agent can actually use.

[Can Agents Use](https://canagentsuse.com) is a public, file-backed directory of
APIs, CLIs, MCP servers, browser-operable products, pricing pages, docs,
sandboxes, and account setup flows. The website is the live searchable surface.
This README is the GitHub surface: a compact map of the project, the data, and
the agent-facing interfaces.

## What Is In The Catalog

| Metric | Count |
| --- | ---: |
| Tools | 1077 |
| Categories | 102 |
| Use cases | 15 |
| Agent-readiness signals | 8 |
| MCP-tagged tools | 22 |
| Native MCP tools | 21 |

Every tool record is scored from evidence, not vibes. A good record answers:

- Can an agent operate it through an API, CLI, MCP server, or browser?
- Are docs, pricing, auth, and account setup clear enough to automate safely?
- Is there a sandbox, test mode, local mode, preview environment, or dry run?
- What should a human review before production use?

## Features

- Fast searchable directory for agent-friendly software.
- Cmd-K style search for tools, categories, and capability signals.
- Category and capability filtering for broad comparisons.
- Tool detail pages with score breakdowns, evidence links, and limitations.
- Public API routes for agents and scripts.
- Read-only MCP-style JSON-RPC endpoint.
- LLM-friendly Markdown exports.
- JSON catalog stored directly in the repo.
- JSON Schema and audit scripts for safer contributions.
- GitHub pull request and agent-prompt submission flow.

## Agent-Readiness Signals

The catalog tracks eight normalized signals:

| Signal | What It Means |
| --- | --- |
| CLI | Official or strong command-line workflow. |
| API | Documented API with machine-friendly auth and examples. |
| MCP | Official or community MCP server for agent integration. |
| Browser | Product can be operated through browser automation when needed. |
| Account creation | Signup and setup are clear enough for assisted onboarding. |
| Pricing clarity | Pricing, limits, and free tiers can be inspected before use. |
| Docs quality | Documentation is complete enough for agent-safe reasoning. |
| Sandbox | Test mode, local mode, preview environment, or safe dry run exists. |

## Scoring Model

Scores are out of 100 and are derived from the evidence in each tool record.

| Group | Points |
| --- | ---: |
| Machine operability | 25 |
| Agent safety | 25 |
| Agent readability | 20 |
| Auth and setup | 15 |
| Production reliability | 15 |

The website keeps the score compact. Agent surfaces expose the detailed
`scoreBreakdown` object.

## Agent Quick Start

Agents should use these read-only public surfaces. Do not ask for database
credentials and do not scrape HTML when skill, MCP, API, OpenAPI, or Markdown
surfaces are enough.

| If You Can... | Use This | Best For |
| --- | --- | --- |
| Install skills | `npx skills add phuctm97/canagentsuse --skill can-agents-use` | Persistent agent instructions and guardrails. |
| Use MCP | `https://canagentsuse.com/api/mcp` | Tool calls from Cursor, Claude Code, Codex, OpenCode, Gemini CLI, and other MCP-aware agents. |
| Fetch HTTP JSON | `https://canagentsuse.com/api/agent/search?q=stripe&page=1&limit=10` | Direct search from scripts, agents, and workflows. |
| Read one big context file | `https://canagentsuse.com/llms-full.txt` | Long-context comparison across many tools. |
| Generate a client | `https://canagentsuse.com/openapi.json` | Typed HTTP clients and automation. |
| Browse as a human | `https://canagentsuse.com` | Visual search, filters, and tool detail pages. |

Recommended agent workflow:

1. Start with the skill or MCP if your agent supports it.
2. Search for a focused query such as `stripe`, `scraping`, `email`, `browser`, `mcp`, or `billing`.
3. Inspect one tool by slug before recommending it.
4. Compare `scoreBreakdown`, `capabilities`, evidence URLs, pricing clarity, sandbox support, and limitations.
5. For broad comparisons, fetch the full catalog once and search locally.
6. Mention caution notes before live money movement, production data changes, account creation, infrastructure changes, or irreversible actions.
7. Treat scores as discovery signals, not legal, security, purchasing, or compliance approval.

## Use The Skill

Can Agents Use ships a skills.sh-discoverable skill at
[`skills/can-agents-use/SKILL.md`](skills/can-agents-use/SKILL.md). The root
[`skills.sh.json`](skills.sh.json) groups the skill for the skills.sh repository
page.

Install with skills.sh:

```bash
npx skills add phuctm97/canagentsuse --skill can-agents-use
```

Use the skill as prompt context:

```bash
npx skills use phuctm97/canagentsuse --skill can-agents-use
```

Manual fallback for agents that read local skill folders:

```bash
mkdir -p ~/.codex/skills/can-agents-use
curl -fsSL https://canagentsuse.com/skill.md \
  -o ~/.codex/skills/can-agents-use/SKILL.md
```

The skill tells agents how to search, when to fetch the full catalog, which MCP
tools exist, and which guardrails to keep.

## Use MCP

Use the read-only MCP endpoint when your agent can call remote MCP tools.

```json
{
  "mcpServers": {
    "canagentsuse": {
      "type": "http",
      "url": "https://canagentsuse.com/api/mcp"
    }
  }
}
```

Available MCP tools:

| Tool | Use It For |
| --- | --- |
| `search_agent_tools` | Search by query, category slug, capability slug, page, and limit. |
| `get_agent_catalog` | Fetch the complete catalog once for broad comparison. |
| `get_agent_tool` | Fetch one tool by slug, including evidence and limitations. |
| `list_agent_categories` | Discover category slugs. |
| `list_agent_capabilities` | Discover capability slugs such as `api`, `cli`, `mcp`, `browser`, and `sandbox`. |
| `get_agent_score_model` | Understand the weighted score model before ranking tools. |

MCP resources:

| Resource | Purpose |
| --- | --- |
| `canagentsuse://catalog` | Full catalog as compact JSON. |
| `canagentsuse://llms-full` | Expanded Markdown context for long-context agents. |

MCP smoke test:

```bash
curl -fsS -X POST https://canagentsuse.com/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Search over MCP:

```bash
curl -fsS -X POST https://canagentsuse.com/api/mcp \
  -H 'content-type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_agent_tools",
      "arguments": {
        "query": "stripe",
        "page": 1,
        "limit": 10
      }
    }
  }'
```

Fetch one tool over MCP:

```bash
curl -fsS -X POST https://canagentsuse.com/api/mcp \
  -H 'content-type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_agent_tool",
      "arguments": {
        "slug": "stripe"
      }
    }
  }'
```

Search defaults to page `1` and `limit` `10`; `limit` maxes at `50`. Keep
queries under `120` characters and avoid polling loops.

## Use The HTTP API

Use these endpoints when an agent or script prefers plain HTTP JSON.

| Endpoint | Purpose |
| --- | --- |
| [`/api/agent/search?q=stripe&page=1&limit=10`](https://canagentsuse.com/api/agent/search?q=stripe&page=1&limit=10) | Paginated search. |
| [`/api/agent/catalog`](https://canagentsuse.com/api/agent/catalog) | Full structured catalog. |
| [`/api/agent/tools/stripe`](https://canagentsuse.com/api/agent/tools/stripe) | One tool by slug. |
| [`/openapi.json`](https://canagentsuse.com/openapi.json) | Machine-readable HTTP API contract. |

Search parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | Free-text query. |
| `category` | Optional category slug. |
| `capability` | Optional capability slug. |
| `page` | 1-based page number. |
| `limit` | Results per page, default `10`, max `50`. |

Examples:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=stripe&page=1&limit=10'
curl -fsS 'https://canagentsuse.com/api/agent/search?capability=mcp&limit=20'
curl -fsS 'https://canagentsuse.com/api/agent/catalog'
curl -fsS 'https://canagentsuse.com/api/agent/tools/github'
curl -fsS 'https://canagentsuse.com/openapi.json'
```

For broad comparisons, prefer one `/api/agent/catalog` request over paging
through every search result.

## Use Markdown Context

Use Markdown surfaces when an agent needs plain text context instead of JSON.

| Surface | Purpose |
| --- | --- |
| [`/llms.txt`](https://canagentsuse.com/llms.txt) | Short orientation file. |
| [`/llms-full.txt`](https://canagentsuse.com/llms-full.txt) | Larger catalog context for long-context agents. |
| [`/skill.md`](https://canagentsuse.com/skill.md) | Copyable skill instructions and guardrails. |
| [`/agents`](https://canagentsuse.com/agents) | Human-readable install guide. |

Examples:

```bash
curl -fsS https://canagentsuse.com/llms.txt
curl -fsS https://canagentsuse.com/llms-full.txt
curl -fsS https://canagentsuse.com/skill.md
```

## Data Is The Product

The repo is intentionally file-backed. There is no database required to run,
build, or contribute.

- [`data/catalog.json`](data/catalog.json): canonical catalog data.
- [`data/catalog.schema.json`](data/catalog.schema.json): validation schema for editors and agents.
- [`data/README.md`](data/README.md): data format notes.

JSON is used because it is native to Next.js, TypeScript, APIs, MCP responses,
and LLM-facing exports. Markdown is kept for documentation.

## Example Tool Shape

```json
{
  "slug": "stripe",
  "name": "Stripe",
  "websiteUrl": "https://stripe.com",
  "docsUrl": "https://docs.stripe.com",
  "mcpServer": "https://mcp.stripe.com",
  "categorySlugs": ["billing-payments"],
  "useCaseSlugs": ["charge-a-customer"],
  "capabilities": [
    {
      "slug": "api",
      "supportLevel": "native",
      "detail": "REST API covers payments, billing, customers, webhooks, and reporting.",
      "evidenceUrl": "https://docs.stripe.com/api"
    }
  ]
}
```

## Local Development

```bash
bun install
bun run dev
```

Open `http://localhost:60139`.

Useful checks:

```bash
bun run catalog:audit
bun run build
```

## Contributing

The best contribution is a well-evidenced catalog record.

1. Edit [`data/catalog.json`](data/catalog.json).
2. Add evidence URLs for important API, CLI, MCP, pricing, docs, sandbox, or account setup claims.
3. Include limitation notes for anything that affects money, production data, infrastructure, or users.
4. Run `bun run catalog:audit`.
5. Open a pull request.

If you are not ready to edit JSON, use the website submit flow to open a
prefilled GitHub pull request or copy a ready-to-run agent prompt.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Bun
- Static JSON data

## Project Goal

Make the GitHub repo and the domain the two canonical ways to discover, inspect,
and improve the catalog. The website should be the fastest way to search. The
README should be the fastest way to understand why the repo is worth starring,
forking, and improving.
