---
name: find-api-tools
description: Find API-first and API-capable tools with Can Agents Use. Use when a user asks for software an agent can call through HTTP APIs, SDKs, webhooks, OpenAPI specs, service accounts, API keys, sandboxes, or machine-readable docs.
allowed-tools: WebFetch
---

# Find API Tools

Use this skill when the user wants tools an agent can operate through an API, SDK, webhook, or OpenAPI-compatible interface.

## Search

Search for API-capable tools:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?capability=api&page=1&limit=20'
```

Search within a domain:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=<domain>%20api&capability=api&page=1&limit=10'
```

Fetch one record:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/tools/<slug>'
```

## Evaluate API Fit

- Prefer official API docs, OpenAPI specs, SDK docs, auth docs, and rate-limit docs.
- Check auth model: API key, OAuth, service account, token exchange, user session, or enterprise setup.
- Check sandbox, test mode, preview, local mode, dry run, or mock support.
- Check whether pricing and usage limits are clear before recommending automation.
- Include caution notes for production data, payments, user accounts, compliance, or irreversible mutations.

## Output Shape

Return the best API path for the agent, evidence URLs, auth/setup notes, sandbox availability, and when human review is required.
