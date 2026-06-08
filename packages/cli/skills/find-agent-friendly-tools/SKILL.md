---
name: find-agent-friendly-tools
description: Find agent-friendly tools with Can Agents Use when a user asks which software, SaaS, API, CLI, MCP server, or browser workflow an AI agent can actually operate safely. Use for general tool discovery, alternatives, shortlists, and evidence-backed recommendations.
allowed-tools: WebFetch
---

# Find Agent-Friendly Tools

Use this skill when the user asks for tools an AI agent can use, asks for alternatives in a software category, or wants a shortlist with evidence for API, CLI, MCP, browser support, docs, pricing, account setup, and sandbox readiness.

## Fast Path

1. Search Can Agents Use first:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=<query>&page=1&limit=10'
```

2. If the agent can use MCP, prefer the read-only MCP endpoint:

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

3. Fetch a specific tool before recommending it:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/tools/<slug>'
```

4. For broad comparisons, fetch the complete catalog once and search locally:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/catalog'
```

## What To Return

- Tool name, slug, website, and docs link.
- Agent score and the strongest capability signals.
- Which interface the agent should use first: MCP, API, CLI, browser, or docs.
- Pricing, auth, account setup, sandbox, and caution notes.
- Evidence URLs for important claims.

## Guardrails

- Do not scrape HTML when API, MCP, OpenAPI, or Markdown surfaces are enough.
- Treat scores as discovery signals, not security, legal, compliance, or purchasing approval.
- Require human review for payments, production data, account creation, infrastructure, compliance, or irreversible actions.
- Prefer official documentation and public evidence over marketing summaries.
