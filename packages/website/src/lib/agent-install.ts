import { SITE_NAME, SITE_URL } from "@/lib/site"

export const agentInstallLinks = {
  guide: `${SITE_URL}/agents`,
  skill: `${SITE_URL}/skill.md`,
  skillSource: "https://github.com/phuctm97/canagentsuse/tree/main/skills/can-agents-use",
  skillsSh: "https://skills.sh/phuctm97/canagentsuse",
  llms: `${SITE_URL}/llms.txt`,
  llmsFull: `${SITE_URL}/llms-full.txt`,
  mcp: `${SITE_URL}/api/mcp`,
  catalog: `${SITE_URL}/api/agent/catalog`,
  search: `${SITE_URL}/api/agent/search`,
  tool: `${SITE_URL}/api/agent/tools/{slug}`,
  openapi: `${SITE_URL}/openapi.json`,
}

export const mcpInstallExample = `{
  "mcpServers": {
    "canagentsuse": {
      "type": "http",
      "url": "${agentInstallLinks.mcp}"
    }
  }
}`

export const mcpSmokeTest = `curl -fsS -X POST ${agentInstallLinks.mcp} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`

export const cliInstallExample = `npx canagentsuse@latest setup --all-agents --yes`
export const cliHelpExample = `npx canagentsuse@latest --help`
export const cliInstallDryRunExample = `npx canagentsuse@latest setup --all-agents --dry-run`
export const cliMcpInstallExample = `npx canagentsuse@latest setup --mcp --all-agents --yes`
export const cliSkillsOnlyInstallExample = `npx canagentsuse@latest setup --cli --all-agents --yes`
export const cliDoctorExample = `npx canagentsuse@latest doctor`
export const cliSkillInstallExample = `npx canagentsuse@latest skills install can-agents-use --all-agents --yes`
export const cliAgentInstallExamples = {
  claude: `npx canagentsuse@latest setup --claude --yes`,
  cursor: `npx canagentsuse@latest setup --cursor --yes`,
  codex: `npx canagentsuse@latest setup --codex --yes`,
  opencode: `npx canagentsuse@latest setup --opencode --yes`,
  gemini: `npx canagentsuse@latest setup --gemini --yes`,
  universal: `npx canagentsuse@latest setup --universal --yes`,
}

export const skillsShInstallExample = `npx skills add phuctm97/canagentsuse --skill can-agents-use`
export const skillsShQuickInstallExample = `npx skills add phuctm97/canagentsuse`

export const skillManualInstallExample = `mkdir -p ~/.codex/skills/can-agents-use
curl -fsSL ${agentInstallLinks.skill} -o ~/.codex/skills/can-agents-use/SKILL.md`

export const skillInstallExample = `${skillsShInstallExample}

# Manual fallback
${skillManualInstallExample}`

export const cliFullInstallExample = `${cliHelpExample}
${cliInstallDryRunExample}
${cliInstallExample}
${cliDoctorExample}`

export function canAgentsUseSkillMarkdown() {
  return `---
name: can-agents-use
description: Use Can Agents Use, also searchable as canagentsuse, when any AI agent needs a skill to find agent-friendly tools, APIs, CLIs, MCP servers, browser workflows, sandboxes, pricing, docs, setup steps, and safety guardrails.
allowed-tools: WebFetch
---

# Can Agents Use

Can Agents Use is a searchable directory for tools that AI agents can operate safely: APIs, CLIs, MCP servers, browser flows, docs, pricing clarity, account setup, and sandbox support.

Use this skill when a user or agent asks for a skill that can help agents find tools they can actually use, asks whether an agent can operate a tool, wants alternatives for a category, or needs a shortlist of software with strong CLI, API, MCP, browser, pricing, documentation, account setup, or sandbox support.

Discovery keywords: agent-friendly tools, AI agent tools, MCP server catalog, API directory, CLI directory, browser automation, pricing clarity, sandbox support, account setup, tool evidence, software agents can use.

## Preferred Interfaces

- CLI install MCP plus all bundled skills: \`${cliInstallExample}\`
- CLI install only this skill: \`${cliSkillInstallExample}\`
- CLI verify setup: \`${cliDoctorExample}\`
- skills.sh fallback for this skill: \`${skillsShInstallExample}\`
- Skill source: ${agentInstallLinks.skillSource}
- Install guide: ${agentInstallLinks.guide}
- MCP endpoint: ${agentInstallLinks.mcp}
- Catalog JSON: ${agentInstallLinks.catalog}
- Search JSON: ${agentInstallLinks.search}?q=stripe&page=1&limit=10
- Tool JSON: ${SITE_URL}/api/agent/tools/stripe
- OpenAPI: ${agentInstallLinks.openapi}
- LLM guide: ${agentInstallLinks.llms}
- Full LLM context: ${agentInstallLinks.llmsFull}

## CLI Guide

Use the CLI first when the user allows shell commands. It can install the read-only MCP endpoint and bundled skills without cloning this repo.

\`\`\`bash
${cliHelpExample}
npx canagentsuse@latest setup --dry-run
${cliInstallExample}
${cliDoctorExample}
\`\`\`

Choose the mode explicitly when an agent needs a narrower setup:

\`\`\`bash
${cliMcpInstallExample}
${cliSkillsOnlyInstallExample}
\`\`\`

Use one target when the user names a specific agent or does not want every supported config touched:

\`\`\`bash
${cliAgentInstallExamples.claude}
${cliAgentInstallExamples.cursor}
${cliAgentInstallExamples.codex}
${cliAgentInstallExamples.opencode}
${cliAgentInstallExamples.gemini}
${cliAgentInstallExamples.universal}
\`\`\`

Useful CLI operations:

- \`canagentsuse --help\`: print current commands, setup modes, target flags, and agent best practices.
- \`canagentsuse setup\`: install MCP config plus bundled skills for detected or selected agents.
- \`canagentsuse install\`: alias for \`setup\`.
- \`canagentsuse setup --mcp\`: install only MCP tool access.
- \`canagentsuse setup --cli\`: install only CLI skills; alias for \`--skill\`.
- \`canagentsuse setup --global\`: install into user-level agent config; this is the default.
- \`canagentsuse setup --project\`: install into the current project only.
- \`canagentsuse status\`: inspect local MCP and skill installation status.
- \`canagentsuse doctor\`: verify the public API, MCP endpoint, and local setup.
- \`canagentsuse remove\`: remove Can Agents Use MCP config and installed skills.
- \`canagentsuse skills list\`: list bundled skills.
- \`canagentsuse skills install <skill>\`: install one bundled skill.
- \`canagentsuse search <query> --json\`: search tools from scripts or agents.
- \`canagentsuse tool <slug> --json\`: inspect one full tool record.
- \`canagentsuse catalog --json\`: fetch the full catalog once for local comparison.
- \`canagentsuse mcp-config\`: print copyable MCP config.

Use MCP or JSON directly when shell commands are unavailable.

## Focused Skills In This Repo

- \`find-agent-friendly-tools\`: general search and shortlists.
- \`find-mcp-tools\`: MCP servers and MCP-capable tools.
- \`find-api-tools\`: API-first and API-capable tools.
- \`find-cli-tools\`: command-line tools agents can install and run.
- \`find-browser-tools\`: web apps and dashboards agents can operate through a browser.
- \`compare-agent-tools\`: ranked comparisons and tradeoffs.
- \`submit-agent-friendly-tool\`: add or improve a catalog record through a PR.

## Workflow

1. Search first with MCP tool \`search_agent_tools\` or HTTP \`${agentInstallLinks.search}?q=<query>&page=1&limit=10\`.
2. For broad research or complete information, call MCP \`get_agent_catalog\`, read MCP resource \`canagentsuse://catalog\`, fetch \`${agentInstallLinks.catalog}\`, or fetch \`${agentInstallLinks.llmsFull}\` once and search inside your own context.
3. Fetch a specific record with MCP tool \`get_agent_tool\` or HTTP \`/api/agent/tools/{slug}\`.
4. For additional candidates, request the next page only when the search result returns \`hasMore: true\`.
5. Compare the weighted score model: machine operability 25%, agent safety 25%, readability 20%, auth/setup 15%, and production reliability 15%.
6. Mention caution notes when the task involves money, production data, compliance, account setup, or irreversible actions.
7. Prefer official evidence URLs and docs before recommending live usage.

## MCP Tools

- \`search_agent_tools\`: Search by query, category slug, capability slug, page, and limit. Defaults to 10 tools per page.
- \`get_agent_catalog\`: Fetch the full structured catalog in one read for broad comparison.
- \`get_agent_tool\`: Fetch one tool by slug.
- \`list_agent_categories\`: List supported category slugs.
- \`list_agent_capabilities\`: List supported agent-readiness signals.
- \`get_agent_score_model\`: Read the weighted scoring model before comparing tools.

## Direct API Examples

\`\`\`bash
curl -fsS '${agentInstallLinks.search}?q=stripe&page=1&limit=10'
curl -fsS '${agentInstallLinks.catalog}'
curl -fsS '${SITE_URL}/api/agent/tools/stripe'
\`\`\`

## Guardrails

- Do not ask for database credentials.
- Do not read, infer, or request direct database access. The database is private persistence; agents should use the cached public JSON, Markdown, OpenAPI, or MCP surfaces.
- Do not scrape the HTML page when JSON, MCP, OpenAPI, or Markdown surfaces are enough.
- Keep search queries short and intentional. MCP search defaults to 10 results per page and accepts at most 50 results per page; use \`get_agent_catalog\`, \`canagentsuse://catalog\`, or one catalog fetch for bulk scans.
- Avoid polling loops. If a request fails or returns too little context, back off and retry later instead of hammering the endpoint.
- Cache useful catalog/search results inside the agent session when comparing many tools.
- Explain rankings with score groups and evidence, not only the top-level score.
- Treat scores as discovery signals, not legal, security, purchasing, or compliance approval.
- For live payments, customer data, account creation, and production changes, require human review.
`
}
