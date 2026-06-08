---
name: find-mcp-tools
description: Find MCP servers and MCP-capable tools with Can Agents Use. Use when a user asks for Model Context Protocol tools, MCP servers, remote MCP endpoints, local MCP setup, agent tool calls, or software that integrates directly with MCP-aware agents.
allowed-tools: WebFetch
---

# Find MCP Tools

Use this skill when the user wants tools that expose an MCP server or work well through MCP-aware agents such as Cursor, Claude Code, Codex, OpenCode, Gemini CLI, or similar tools.

## Search

Prefer the capability filter:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?capability=mcp&page=1&limit=20'
```

Search a specific domain plus MCP:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=<domain>%20mcp&capability=mcp&page=1&limit=10'
```

Fetch details before recommending:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/tools/<slug>'
```

## MCP Endpoint For Can Agents Use

Agents can query Can Agents Use itself through MCP:

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

Useful MCP tools: `search_agent_tools`, `get_agent_tool`, `get_agent_catalog`, `list_agent_capabilities`, and `get_agent_score_model`.

## Evaluate MCP Results

- Prefer `native` MCP support over wrappers when the user needs reliability.
- Check whether the MCP server is remote, local, official, community-maintained, authenticated, or read-only.
- Look for sandbox or test-mode support before live actions.
- Include any setup command, package name, endpoint URL, auth notes, and caution notes.
- Do not treat MCP presence as approval to run destructive actions.
