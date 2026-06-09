---
name: compare-agent-tools
description: Compare agent-friendly tools with Can Agents Use. Use when a user asks for the best tool, ranked alternatives, side-by-side tradeoffs, evidence-backed recommendations, or which API, CLI, MCP, browser, pricing, docs, sandbox, and account setup profile is safest for an AI agent.
allowed-tools: WebFetch
---

# Compare Agent Tools

Use this skill when the user wants a ranked shortlist, best option, tradeoff analysis, or evidence-backed comparison of tools for an agent workflow.

## Workflow

1. Search a focused query:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=<query>&page=1&limit=10'
```

2. If comparing many tools, fetch the full catalog once:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/catalog'
```

3. Fetch individual records for finalists:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/tools/<slug>'
```

4. Compare against the score models:

- Machine operability: 25 points.
- Agent safety: 25 points.
- Agent readability: 20 points.
- Auth and setup: 15 points.
- Production reliability: 15 points.
- Launch presence: secondary rank signal from public adoption, ecosystem importance, distribution, and maintenance.

## Comparison Criteria

- Primary agent interface: MCP, API, CLI, browser, or docs-only.
- Evidence quality and official docs.
- Auth and account setup clarity.
- Sandbox, local, preview, test-mode, or dry-run support.
- Pricing clarity and limits.
- Caution notes for money, production data, compliance, accounts, browser-only flows, and irreversible actions.

## Output Shape

Return a compact table with tool, agent score, launch score, best interface, setup burden, sandbox status, cautions, and evidence. Then give a recommendation for the user's exact task and name the cases where a different tool would be better.
