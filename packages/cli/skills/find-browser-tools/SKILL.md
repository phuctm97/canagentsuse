---
name: find-browser-tools
description: Find browser-operable tools with Can Agents Use. Use when a user asks whether an agent can use a web app, dashboard, admin console, signup flow, pricing page, documentation site, or browser automation workflow safely.
allowed-tools: WebFetch
---

# Find Browser Tools

Use this skill when the user needs to know whether an agent can operate a product through a browser, especially when no API, CLI, or MCP interface is available.

## Search

Search browser-operable tools:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?capability=browser&page=1&limit=20'
```

Search a domain:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/search?q=<domain>%20browser&capability=browser&page=1&limit=10'
```

Fetch one record:

```bash
curl -fsS 'https://canagentsuse.com/api/agent/tools/<slug>'
```

## Evaluate Browser Fit

- Prefer API, CLI, or MCP over browser automation when available.
- Check whether signup, login, pricing, docs, and account setup are clear.
- Look for stable URLs, accessible forms, preview modes, sandboxes, and confirmation screens.
- Warn when the workflow depends on brittle UI automation, CAPTCHA, MFA, payment steps, admin privileges, or production data.
- Require human approval for actions that spend money, invite users, delete data, change infrastructure, or submit forms externally.

## Output Shape

Return whether browser is a fallback or primary path, safer alternatives if available, evidence links, and the exact human approval points.
