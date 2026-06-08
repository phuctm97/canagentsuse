# Can Agents Use

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

## Public Surfaces

| Surface | Purpose |
| --- | --- |
| [`/`](https://canagentsuse.com) | Human directory with local search and filters. |
| [`/agents`](https://canagentsuse.com/agents) | Instructions for agent usage. |
| [`/llms.txt`](https://canagentsuse.com/llms.txt) | Short LLM orientation file. |
| [`/llms-full.txt`](https://canagentsuse.com/llms-full.txt) | Larger Markdown catalog context. |
| [`/skill.md`](https://canagentsuse.com/skill.md) | Copyable skill-style instructions. |
| [`/api/agent/catalog`](https://canagentsuse.com/api/agent/catalog) | Full structured JSON catalog. |
| [`/api/agent/search?q=stripe`](https://canagentsuse.com/api/agent/search?q=stripe) | Paginated agent search. |
| `/api/agent/tools/{slug}` | Stable JSON record for one tool. |
| [`/api/mcp`](https://canagentsuse.com/api/mcp) | Read-only MCP-style JSON-RPC endpoint. |
| [`/openapi.json`](https://canagentsuse.com/openapi.json) | HTTP API contract. |

For broad comparisons, fetch the full catalog once and search locally. Search
defaults to 10 results per page and caps `limit` at 50.

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

Open `http://localhost:3333`.

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
