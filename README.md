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
| Run the CLI | `npx canagentsuse@latest setup --all-agents --yes` | One-command MCP plus bundled skill setup for Claude Code, Cursor, Codex, OpenCode, Gemini CLI, and universal agent folders. |
| Ask how to connect | `https://canagentsuse.com/api/agent/install` | Structured setup guide for CLI, MCP, skills, API, and Markdown surfaces. |
| Use MCP | `https://canagentsuse.com/api/mcp` | Tool calls from Cursor, Claude Code, Codex, OpenCode, Gemini CLI, and other MCP-aware agents. |
| Install only skills | `npx canagentsuse@latest skills install can-agents-use --all-agents --yes` | Persistent agent instructions and focused discovery skills. |
| Fetch HTTP JSON | `https://canagentsuse.com/api/agent/search?q=stripe&page=1&limit=10` | Direct search from scripts, agents, and workflows. |
| Read one big context file | `https://canagentsuse.com/llms-full.txt` | Long-context comparison across many tools. |
| Generate a client | `https://canagentsuse.com/openapi.json` | Typed HTTP clients and automation. |
| Browse as a human | `https://canagentsuse.com` | Visual search, filters, and tool detail pages. |

Recommended agent workflow:

1. Start with `npx canagentsuse@latest setup --all-agents --yes` when you can run shell commands.
2. Search for a focused query such as `stripe`, `scraping`, `email`, `browser`, `mcp`, or `billing`.
3. Inspect one tool by slug before recommending it.
4. Compare `scoreBreakdown`, `capabilities`, evidence URLs, pricing clarity, sandbox support, and limitations.
5. For broad comparisons, fetch the full catalog once and search locally.
6. Mention caution notes before live money movement, production data changes, account creation, infrastructure changes, or irreversible actions.
7. Treat scores as discovery signals, not legal, security, purchasing, or compliance approval.

## Use The CLI

Use the CLI when you want one-command agent setup or terminal-first discovery
without installing the repo. It calls the same public read-only API that agents
use and can replace the older `npx skills` flow for supported local agents.

```bash
npx canagentsuse@latest --help
npx canagentsuse@latest setup
npx canagentsuse@latest setup --all-agents --dry-run
npx canagentsuse@latest setup --all-agents --yes
npx canagentsuse@latest setup --mcp --claude --yes
npx canagentsuse@latest setup --cli --cursor --yes
npx canagentsuse@latest doctor
npx canagentsuse@latest search stripe
npx canagentsuse@latest search "email api" --capability api --limit 5
npx canagentsuse@latest search --capability mcp --json
npx canagentsuse@latest tool stripe
npx canagentsuse@latest mcp-config
npx canagentsuse@latest install-guide --json
```

| Command | Use It For |
| --- | --- |
| `canagentsuse install` | Alias for setup; useful as the direct mental replacement for `npx skills add`. |
| `canagentsuse setup` | Install Can Agents Use MCP config and bundled skills for detected or selected agents. |
| `canagentsuse setup --mcp` | Install only MCP tool access. |
| `canagentsuse setup --cli` | Install only CLI skills; alias for `--skill`. |
| `canagentsuse setup --global` | Install into global user config; this is the default. |
| `canagentsuse setup --project` | Install into the current project only. |
| `canagentsuse remove` | Remove the MCP config and installed Can Agents Use skills. |
| `canagentsuse status` | Show installed MCP and skill status by agent. |
| `canagentsuse doctor` | Test the public API, MCP endpoint, and local setup. |
| `canagentsuse skills list` | List bundled skills that can be installed locally. |
| `canagentsuse skills install <skill>` | Install one bundled skill into an agent skill directory. |
| `canagentsuse search [query]` | Find tools by query, category, capability, page, and limit. |
| `canagentsuse tool <slug>` | Inspect one complete tool record before recommending it. |
| `canagentsuse catalog --json` | Fetch the full catalog once for local agent-side comparison. |
| `canagentsuse mcp-config` | Print copyable MCP config for agent clients. |
| `canagentsuse install-guide` | Fetch the structured setup guide for CLI, MCP, skills, API, and Markdown use. |
| `canagentsuse score-model` | Inspect how the agent-readiness score is weighted. |
| `canagentsuse docs` | List the website, skill, MCP, OpenAPI, and Markdown surfaces. |

Setup targets:

```bash
npx canagentsuse@latest setup --claude --yes
npx canagentsuse@latest setup --cursor --yes
npx canagentsuse@latest setup --codex --yes
npx canagentsuse@latest setup --opencode --yes
npx canagentsuse@latest setup --gemini --yes
npx canagentsuse@latest setup --universal --yes
```

Run bare `npx canagentsuse@latest setup` in an interactive terminal to choose
mode, target, and install location. Agents and scripts should pass explicit flags
plus `--yes`.

Setup defaults to global user config. Use `--global` to be explicit, or
`--project` to write project-local config such as `.mcp.json`,
`.cursor/mcp.json`, `.codex/config.toml`, `.gemini/settings.json`, or
`opencode.json`. Use `--dry-run` before writing; the CLI backs up existing config
files before editing and only updates the `canagentsuse` MCP entry.

For scripts and agents, prefer `--json`:

```bash
npx canagentsuse@latest search "billing api" --capability api --limit 10 --json
```

The default site is `https://canagentsuse.com`. Override it for previews:

```bash
CANAGENTSUSE_SITE_URL=https://www.canagentsuse.com npx canagentsuse@latest catalog --json
```

## Use The Skills

Can Agents Use ships skills.sh-discoverable skills in [`skills/`](skills). The
root [`skills.sh.json`](skills.sh.json) groups them for the skills.sh repository
page at [skills.sh/phuctm97/canagentsuse](https://skills.sh/phuctm97/canagentsuse).
The CLI is preferred for local agent setup because it installs both MCP and
skills where possible. Use skills.sh as a registry fallback.

List the bundled CLI skills:

```bash
npx canagentsuse@latest skills list
```

Install all bundled skills into all supported agent folders:

```bash
npx canagentsuse@latest skills install --all --all-agents --yes
```

skills.sh fallback list command:

```bash
npx skills add phuctm97/canagentsuse --list
```

skills.sh fallback install all:

```bash
npx skills add phuctm97/canagentsuse
```

skills.sh fallback install one focused skill:

```bash
npx skills add phuctm97/canagentsuse --skill find-mcp-tools
```

| Skill | Use It When |
| --- | --- |
| [`can-agents-use`](skills/can-agents-use/SKILL.md) | You want the umbrella skill with all Can Agents Use surfaces and guardrails. |
| [`find-agent-friendly-tools`](skills/find-agent-friendly-tools/SKILL.md) | You need a general shortlist of tools an agent can actually operate. |
| [`find-mcp-tools`](skills/find-mcp-tools/SKILL.md) | You need MCP servers or MCP-capable tools. |
| [`find-api-tools`](skills/find-api-tools/SKILL.md) | You need API-first tools, SDKs, webhooks, OpenAPI specs, or service-account workflows. |
| [`find-cli-tools`](skills/find-cli-tools/SKILL.md) | You need tools an agent can install and run from a terminal. |
| [`find-browser-tools`](skills/find-browser-tools/SKILL.md) | You need products an agent can operate through browser automation. |
| [`compare-agent-tools`](skills/compare-agent-tools/SKILL.md) | You need ranked alternatives, score tradeoffs, and evidence-backed recommendations. |
| [`submit-agent-friendly-tool`](skills/submit-agent-friendly-tool/SKILL.md) | You want to add or improve a catalog record with a PR. |

Manual fallback for agents that read local skill folders:

```bash
mkdir -p ~/.codex/skills/can-agents-use
curl -fsSL https://canagentsuse.com/skill.md \
  -o ~/.codex/skills/can-agents-use/SKILL.md
```

The `/skill.md` fallback exposes the umbrella skill. Use the CLI when you want
the full multi-skill folder copied into local agent directories.

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
| [`/api/agent/install`](https://canagentsuse.com/api/agent/install) | Structured setup guide for CLI, MCP, skills, API, Markdown, and guardrails. |
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
curl -fsS 'https://canagentsuse.com/api/agent/install'
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

## Repository Layout

This repo is a Bun workspace monorepo with two packages:

| Path | Package | Purpose |
| --- | --- | --- |
| [`packages/website`](packages/website) | `@canagentsuse/website` | Next.js website, API routes, MCP endpoint, shadcn UI, and catalog audit script. |
| [`packages/cli`](packages/cli) | `canagentsuse` | Publishable npm CLI with the `canagentsuse` and `cau` binaries. |

Project assets stay at the root so GitHub readers and agents can find them
quickly:

- [`data/catalog.json`](data/catalog.json): canonical catalog data.
- [`skills/`](skills): skills.sh-discoverable skills.
- [`skills.sh.json`](skills.sh.json): skills.sh metadata.
- [`.github/PULL_REQUEST_TEMPLATE/add-tool.md`](.github/PULL_REQUEST_TEMPLATE/add-tool.md): contribution template.

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

Website-specific env examples live in
[`packages/website/.env.example`](packages/website/.env.example). Put local
website env in `packages/website/.env.local`.

Useful checks:

```bash
bun run catalog:audit
bun run cli:test
bun run cli:pack
bun run build
```

Run every main repo check:

```bash
bun run check
```

## Deploy The Website

The Vercel project should deploy the website package from this monorepo:

| Vercel Setting | Value |
| --- | --- |
| Root Directory | `packages/website` |
| Framework Preset | `Next.js` |
| Install Command | Auto-detected Bun install, or `bun install --frozen-lockfile` |
| Build Command | `bun run build` |
| Output Directory | Auto-detected `.next` |

Keep these env vars on the Vercel website project:

```bash
NEXT_PUBLIC_SITE_URL="https://canagentsuse.com"
NEXT_PUBLIC_OG_ASSET_URL="https://canagentsuse.vercel.app"
```

## Release With Changesets

Releases are driven by committed Changesets in [`.changeset`](.changeset). A
changeset is the version plan file for one or both packages.

Create a release plan:

```bash
bun run changeset
```

Use these package names:

| Package | Release Target |
| --- | --- |
| `canagentsuse` | Publishes the public npm CLI package. |
| `@canagentsuse/website` | Versions the website package and deploys the website. |

When a commit lands on `main` with `.changeset/*.md`, the `Release` workflow:

1. Reads the changeset files and detects which packages need release.
2. Runs `changeset version` to update package versions and changelogs.
3. Syncs the CLI runtime version constant from `packages/cli/package.json`.
4. Runs catalog, CLI, package, and website build checks.
5. Publishes `canagentsuse` to npm if the CLI package is in the plan.
6. Deploys `@canagentsuse/website` if the website package is in the plan.
7. Pushes the version commit and tags back to `main`.

The CLI publish path is set up for npm Trusted Publishing through GitHub Actions
OIDC, so no long-lived npm token is required when npm trusted publishing is
configured. An optional `NPM_TOKEN` secret is still supported as a fallback.

Optional Vercel secrets for explicit GitHub Actions deploys:

```bash
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

If those Vercel secrets are not set, the workflow still pushes the version
commit; a connected Vercel Git integration can deploy that commit normally.

## Contributing

The best contribution is a well-evidenced catalog record.

1. Edit [`data/catalog.json`](data/catalog.json).
2. Add evidence URLs for important API, CLI, MCP, pricing, docs, sandbox, or account setup claims.
3. Include limitation notes for anything that affects money, production data, infrastructure, or users.
4. Add a changeset when the change should release the website or CLI.
5. Run `bun run catalog:audit`.
6. Open a pull request.

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
